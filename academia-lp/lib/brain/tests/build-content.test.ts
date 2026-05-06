import { describe, expect, it } from 'vitest'
import { buildBrainContent } from '../build-content'
import { resolve } from 'node:path'

const cerebroDir = resolve(__dirname, '../../../../Cerebro')

describe('buildBrainContent', () => {
  it('separates knowledge and personality and excludes file names from content', async () => {
    const result = await buildBrainContent(cerebroDir)

    // Both sections must have substantial content.
    expect(result.knowledge.length).toBeGreaterThan(10_000)
    expect(result.personality.length).toBeGreaterThan(1_000)
    // File paths MUST NOT appear inside the content (the model would cite them).
    expect(result.knowledge).not.toContain('METODO NARDO ACADEMY.docx')
    expect(result.knowledge).not.toContain('alimento/')
    expect(result.personality).not.toContain('personalidad_lidiane/')
    expect(result.personality).not.toContain('transcripciones_directos/')
    // sources list keeps file paths for diagnostics.
    expect(result.sources).toContain('METODO NARDO ACADEMY.docx')
    expect(result.sources.some((s) => s.startsWith('alimento/'))).toBe(true)
    expect(result.sources.some((s) => s.startsWith('personalidad_lidiane/'))).toBe(true)
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produces the same hash on consecutive calls', async () => {
    const a = await buildBrainContent(cerebroDir)
    const b = await buildBrainContent(cerebroDir)
    expect(a.hash).toBe(b.hash)
  })

  it('skips MERGEALL.docx (duplicate of aulas/N.docx)', async () => {
    const result = await buildBrainContent(cerebroDir)
    expect(result.sources).not.toContain('alimento/aulas/MERGEALL.docx')
  })
})
