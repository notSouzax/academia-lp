import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

let loaded = false

function loadDotEnvLocal(): void {
  if (loaded) return
  loaded = true
  const path = join(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

export function loadEnv<K extends string>(keys: readonly K[]): Record<K, string> {
  loadDotEnvLocal()
  const out = {} as Record<K, string>
  const missing: string[] = []
  for (const k of keys) {
    const v = process.env[k]
    if (!v) {
      missing.push(k)
    } else {
      out[k] = v
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars: ${missing.join(', ')}. ` +
        `Make sure they are set in .env.local or in your shell.`
    )
  }
  return out
}
