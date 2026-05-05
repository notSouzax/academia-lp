import { randomInt } from 'node:crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCode(): string {
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[randomInt(0, ALPHABET.length)]
  }
  return `NARDO-${suffix}`
}
