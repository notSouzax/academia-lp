import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const KNOWLEDGE_FILE = resolve(process.cwd(), 'lib', 'brain', '_knowledge.txt')
const PERSONALITY_FILE = resolve(process.cwd(), 'lib', 'brain', '_personality.txt')

export function getKnowledgePath(): string {
  return KNOWLEDGE_FILE
}

export function getPersonalityPath(): string {
  return PERSONALITY_FILE
}

export async function writeBrainFiles(knowledge: string, personality: string): Promise<void> {
  await mkdir(dirname(KNOWLEDGE_FILE), { recursive: true })
  await writeFile(KNOWLEDGE_FILE, knowledge, 'utf8')
  await writeFile(PERSONALITY_FILE, personality, 'utf8')
}

export async function readKnowledge(): Promise<string | null> {
  if (!existsSync(KNOWLEDGE_FILE)) return null
  return await readFile(KNOWLEDGE_FILE, 'utf8')
}

export async function readPersonality(): Promise<string | null> {
  if (!existsSync(PERSONALITY_FILE)) return null
  return await readFile(PERSONALITY_FILE, 'utf8')
}
