import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const KNOWLEDGE_FILE = resolve(process.cwd(), 'lib', 'brain', '_knowledge.txt')
const PERSONALITY_FILE = resolve(process.cwd(), 'lib', 'brain', '_personality.txt')
const PERSONALITY_DISTILLED_FILE = resolve(
  process.cwd(),
  'lib',
  'brain',
  '_personality.distilled.txt'
)

export function getKnowledgePath(): string {
  return KNOWLEDGE_FILE
}

export function getPersonalityPath(): string {
  return PERSONALITY_FILE
}

export function getDistilledPersonalityPath(): string {
  return PERSONALITY_DISTILLED_FILE
}

export async function writeBrainFiles(knowledge: string, personality: string): Promise<void> {
  await mkdir(dirname(KNOWLEDGE_FILE), { recursive: true })
  await writeFile(KNOWLEDGE_FILE, knowledge, 'utf8')
  await writeFile(PERSONALITY_FILE, personality, 'utf8')
}

export async function writeDistilledPersonality(text: string): Promise<void> {
  await mkdir(dirname(PERSONALITY_DISTILLED_FILE), { recursive: true })
  await writeFile(PERSONALITY_DISTILLED_FILE, text, 'utf8')
}

export async function readKnowledge(): Promise<string | null> {
  if (!existsSync(KNOWLEDGE_FILE)) return null
  return await readFile(KNOWLEDGE_FILE, 'utf8')
}

/** Personalidad bruta (todas las transcripciones). Solo se usa offline para destilar. */
export async function readRawPersonality(): Promise<string | null> {
  if (!existsSync(PERSONALITY_FILE)) return null
  return await readFile(PERSONALITY_FILE, 'utf8')
}

/**
 * Personalidad para inyectar en el chat. Devuelve el destilado si existe (preferido,
 * mucho más pequeño y enfocado), si no, cae al texto bruto. Si no hay ni uno ni otro,
 * devuelve null.
 */
export async function readPersonalityForChat(): Promise<string | null> {
  if (existsSync(PERSONALITY_DISTILLED_FILE)) {
    return await readFile(PERSONALITY_DISTILLED_FILE, 'utf8')
  }
  if (existsSync(PERSONALITY_FILE)) {
    return await readFile(PERSONALITY_FILE, 'utf8')
  }
  return null
}
