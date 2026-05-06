import { NextResponse, type NextRequest } from 'next/server'
import { streamText, type UIMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPT } from '@/lib/chat/system-prompt'
import { buildChatContext } from '@/lib/chat/build-context'
import { saveMessage } from '@/lib/chat/save-message'
import { maybeUpdateSummary } from '@/lib/chat/summarize'
import { readCacheMeta } from '@/lib/brain/cache-manager'
import { readCompiledBrain } from '@/lib/brain/storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL_ID = 'gemini-2.5-flash'

function isCacheValid(cacheMeta: { cacheId: string | null; expiresAt: string | null }): boolean {
  if (!cacheMeta.cacheId) return false
  if (!cacheMeta.expiresAt) return false
  return new Date(cacheMeta.expiresAt) > new Date()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userResult, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userResult.user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }
  const userId = userResult.user.id

  const body = (await request.json()) as { messages: UIMessage[] }
  const incoming = body.messages
  if (!incoming || incoming.length === 0) {
    return NextResponse.json({ error: 'Faltan mensajes.' }, { status: 400 })
  }

  const lastClientMessage = incoming[incoming.length - 1]
  if (lastClientMessage.role !== 'user') {
    return NextResponse.json({ error: 'El último mensaje debe ser del usuario.' }, { status: 400 })
  }
  const userText = lastClientMessage.parts
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('')
    .trim()
  if (!userText) {
    return NextResponse.json({ error: 'Mensaje vacío.' }, { status: 400 })
  }

  // Persist user message right away
  await saveMessage(supabase, userId, 'user', userText)

  // Build chat context (recent + summary) from DB
  const ctx = await buildChatContext(supabase as never, userId, 15)

  // Decide whether to use Gemini cache or inject compiled brain
  const cacheMeta = await readCacheMeta()
  const useCache = isCacheValid(cacheMeta)

  let systemMessage = SYSTEM_PROMPT
  if (!useCache) {
    const compiled = await readCompiledBrain()
    if (compiled) {
      systemMessage = `${SYSTEM_PROMPT}\n\n# Material del curso (Cerebro)\n\nUsa el siguiente material como tu única fuente de conocimiento sobre el método de la profesora. Cita pasajes textualmente cuando ayude.\n\n${compiled}`
    }
  }

  if (ctx.summary) {
    systemMessage += `\n\n# Resumen de la conversación previa con esta alumna\n\n${ctx.summary}`
  }

  const modelMessages = [
    ...ctx.messages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userText },
  ]

  const result = streamText({
    model: google(MODEL_ID),
    system: systemMessage,
    messages: modelMessages,
    providerOptions: useCache
      ? { google: { cachedContent: cacheMeta.cacheId! } }
      : undefined,
    onFinish: async ({ text }) => {
      try {
        await saveMessage(supabase, userId, 'assistant', text)
        await maybeUpdateSummary(supabase, userId).catch((err) =>
          console.warn('summary update failed:', err)
        )
      } catch (err) {
        console.error('failed to persist assistant message:', err)
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
