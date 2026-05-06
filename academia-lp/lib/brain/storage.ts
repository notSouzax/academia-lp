import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const COMPILED_FILE = resolve(process.cwd(), 'lib', 'brain', '_compiled.txt')

export function getCompiledBrainPath(): string {
  return COMPILED_FILE
}

export async function writeCompiledBrain(content: string): Promise<void> {
  await mkdir(dirname(COMPILED_FILE), { recursive: true })
  await writeFile(COMPILED_FILE, content, 'utf8')
}

export async function readCompiledBrain(): Promise<string | null> {
  if (!existsSync(COMPILED_FILE)) return null
  return await readFile(COMPILED_FILE, 'utf8')
}
