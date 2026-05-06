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
    // sources list keeps file paths for diagnostics.
    expect(result.sources).toContain('alimento/METODO NARDO ACADEMY.docx')
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

  it('skips raw transcripts from personalidad_lidiane/ (only curated .md files count as personality)', async () => {
    const result = await buildBrainContent(cerebroDir)
    const personalitySources = result.sources.filter((s) =>
      s.startsWith('personalidad_lidiane/')
    )
    // None of the included personality sources should be PDFs.
    for (const s of personalitySources) {
      expect(s.endsWith('.md')).toBe(true)
    }
    // The two curated markdowns should be in.
    expect(result.sources).toContain('personalidad_lidiane/15_OBSERVACIONES_AVANZADAS.md')
    expect(result.sources).toContain('personalidad_lidiane/16_HISTORIA_LIDIANE_JORNADA_HEROE.md')
  })
})
