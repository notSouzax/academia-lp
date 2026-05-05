import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

export async function extractText(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()

  if (ext === '.docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  }

  if (ext === '.pdf') {
    const { extractText: extractPdfText } = await import('unpdf')
    const buffer = await readFile(filePath)
    const result = await extractPdfText(new Uint8Array(buffer), { mergePages: true })
    return Array.isArray(result.text) ? result.text.join('\n') : (result.text ?? '')
  }

  throw new Error(`Unsupported file extension: ${ext}`)
}
