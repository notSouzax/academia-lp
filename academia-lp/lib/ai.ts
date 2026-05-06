import { generateText, streamText } from 'ai'
import { google } from '@ai-sdk/google'

/**
 * Modelo de chat principal (calidad alta, contexto grande).
 * Free tier: 20 RPD, 250 RPM, 250k TPM.
 */
export const CHAT_MODEL = 'gemini-2.5-flash'

/**
 * Modelo para procesos offline (destilado de personalidad, resumen del historial).
 * Free tier: 1000 RPD, suficiente calidad para tareas de extracción/sintesis.
 */
export const OFFLINE_MODEL = 'gemini-2.5-flash-lite'

export async function generateOnce(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: google(CHAT_MODEL),
    prompt,
  })
  return text
}

export { streamText }
