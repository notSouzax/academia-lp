import { describe, expect, it } from 'vitest'
import { buildBrainContent } from '../build-content'
import { resolve } from 'node:path'

const cerebroDir = resolve(__dirname, '../../../../Cerebro')

describe('buildBrainContent', () => {
  it('returns concatenated content (without file names) plus a sources list and stable hash', async () => {
    const result = await buildBrainContent(cerebroDir)

    // Content must include actual course material (not file names).
    expect(result.content.toLowerCase()).toContain('nanopigmentación')
    expect(result.content.length).toBeGreaterThan(10_000)
    // File names MUST NOT appear in the content (the model would cite them).
    expect(result.content).not.toContain('METODO NARDO ACADEMY.docx')
    expect(result.content).not.toContain('transcripciones_curso_cejas/')
    // sources list still tracks file paths for diagnostics.
    expect(result.sources).toHaveLength(22)
    expect(result.sources).toContain('METODO NARDO ACADEMY.docx')
    expect(result.sources).toContain('transcripciones_curso_cejas/1.pdf')
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produces the same hash on consecutive calls', async () => {
    const a = await buildBrainContent(cerebroDir)
    const b = await buildBrainContent(cerebroDir)
    expect(a.hash).toBe(b.hash)
  })
})
