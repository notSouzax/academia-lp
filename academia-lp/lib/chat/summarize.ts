import type { SupabaseClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

const SUMMARY_MODEL = 'gemini-2.5-flash'
const TRIGGER_THRESHOLD = 20

export async function maybeUpdateSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { count: total, error: countErr } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (countErr) throw new Error(`Cannot count messages: ${countErr.message}`)
  if (!total || total < TRIGGER_THRESHOLD) return

  const { data: existing } = await supabase
    .from('conversation_summaries')
    .select('summary, last_summarized_message_id')
    .eq('user_id', userId)
    .maybeSingle()

  const previousSummary = existing?.summary ?? ''
  const lastMsgId = existing?.last_summarized_message_id ?? null

  const limitToSummarize = total - 15
  if (limitToSummarize <= 0) return

  const { data: toSummarize, error: fetchErr } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limitToSummarize)
  if (fetchErr) throw new Error(`Cannot fetch messages to summarize: ${fetchErr.message}`)

  if (!toSummarize || toSummarize.length === 0) return

  const newestToSummarize = toSummarize[toSummarize.length - 1]
  if (lastMsgId === newestToSummarize.id) return

  const transcript = toSummarize
    .map((m) => `${m.role === 'user' ? 'Alumna' : 'Asistente'}: ${m.content}`)
    .join('\n\n')

  const prompt = `Resume la siguiente conversación entre una alumna y la asistente IA del curso de nanoblading. El resumen debe ser conciso (máximo 6-8 frases), en español, y capturar las dudas/temas principales tratados, decisiones, y cualquier dato concreto sobre el progreso de la alumna. Mantén el tono neutro descriptivo.

${previousSummary ? `RESUMEN PREVIO:\n${previousSummary}\n\nNUEVOS MENSAJES A INTEGRAR:` : 'CONVERSACIÓN A RESUMIR:'}

${transcript}

Devuelve SOLO el resumen actualizado, sin preámbulos ni explicaciones.`

  const { text: newSummary } = await generateText({
    model: google(SUMMARY_MODEL),
    prompt,
  })

  const { error: upsertErr } = await supabase
    .from('conversation_summaries')
    .upsert({
      user_id: userId,
      summary: newSummary.trim(),
      last_summarized_message_id: newestToSummarize.id,
      updated_at: new Date().toISOString(),
    })
  if (upsertErr) throw new Error(`Cannot upsert summary: ${upsertErr.message}`)
}
