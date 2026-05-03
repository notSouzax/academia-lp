import { generateText, streamText } from 'ai'
import { google } from '@ai-sdk/google'

export const CHAT_MODEL = 'gemini-2.5-flash'

export async function generateOnce(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: google(CHAT_MODEL),
    prompt,
  })
  return text
}

export { streamText }
