import { describe, expect, it } from 'vitest'
import { loadEnv } from '../env'

describe('loadEnv', () => {
  it('returns required keys when present in process.env', () => {
    process.env.TEST_FOO = 'bar'
    const env = loadEnv(['TEST_FOO'] as const)
    expect(env.TEST_FOO).toBe('bar')
  })

  it('throws when a required key is missing', () => {
    delete process.env.MISSING_KEY
    expect(() => loadEnv(['MISSING_KEY'] as const)).toThrow(/MISSING_KEY/)
  })
})
