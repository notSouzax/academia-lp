import { describe, expect, it } from 'vitest'
import { generateCode } from '../code'

describe('generateCode', () => {
  it('returns a string with prefix NARDO- and 4 chars after', () => {
    const code = generateCode()
    expect(code).toMatch(/^NARDO-[A-Z0-9]{4}$/)
  })

  it('generates different codes on consecutive calls (smoke)', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 50; i++) codes.add(generateCode())
    expect(codes.size).toBeGreaterThan(45)
  })

  it('uses an unambiguous alphabet (no 0/O/1/I)', () => {
    for (let i = 0; i < 200; i++) {
      const suffix = generateCode().slice('NARDO-'.length)
      expect(suffix).not.toMatch(/[0OI1]/)
    }
  })
})
