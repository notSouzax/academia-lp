import { describe, expect, it } from 'vitest'
import { validatePasswordStrength } from '../actions'

describe('validatePasswordStrength', () => {
  it('rejects passwords shorter than 8 chars', async () => {
    expect(await validatePasswordStrength('1234567')).toBe('La contraseña debe tener al menos 8 caracteres.')
  })

  it('rejects empty input', async () => {
    expect(await validatePasswordStrength('')).toBe('La contraseña no puede estar vacía.')
  })

  it('accepts valid password', async () => {
    expect(await validatePasswordStrength('contrasena12')).toBe(null)
  })
})
