import { describe, expect, it } from 'vitest'
import { extractText } from '../extract'
import { resolve } from 'node:path'

const cerebroDir = resolve(__dirname, '../../../../Cerebro')

describe('extractText', () => {
  it('extracts text from a DOCX file', async () => {
    const path = resolve(cerebroDir, 'METODO NARDO ACADEMY.docx')
    const result = await extractText(path)
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(1000)
    expect(typeof result).toBe('string')
  })

  it('extracts text from a PDF file', async () => {
    const path = resolve(cerebroDir, 'personalidad_lidiane/transcripciones_directos/1.pdf')
    const result = await extractText(path)
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(100)
    expect(typeof result).toBe('string')
  })

  it('extracts text from a Markdown file', async () => {
    const path = resolve(cerebroDir, 'alimento/00_INDICE_GENERAL.md')
    const result = await extractText(path)
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(50)
    expect(typeof result).toBe('string')
  })

  it('throws on unsupported extension', async () => {
    await expect(extractText('whatever.xyz')).rejects.toThrow(/unsupported/i)
  })
})
