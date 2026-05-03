import { generateText, streamText } from 'ai'

export const CHAT_MODEL = 'google/gemini-2.5-flash'

export async function generateOnce(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: CHAT_MODEL,
    prompt,
  })
  return text
}

export { streamText }
