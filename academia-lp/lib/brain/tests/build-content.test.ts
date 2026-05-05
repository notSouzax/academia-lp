import { describe, expect, it } from 'vitest'
import { buildBrainContent } from '../build-content'
import { resolve } from 'node:path'

const cerebroDir = resolve(__dirname, '../../../../Cerebro')

describe('buildBrainContent', () => {
  it('returns concatenated content with section headers and a stable hash', async () => {
    const result = await buildBrainContent(cerebroDir)

    expect(result.content).toContain('METODO NARDO ACADEMY')
    expect(result.content.length).toBeGreaterThan(10_000)
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
