import { readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, relative, basename } from 'node:path'
import { extractText } from './extract'

export type BrainContent = {
  /** Lo que la profesora ENSEÑA: libro, alimento, aulas. Material curricular. */
  knowledge: string
  /** Cómo la profesora HABLA: personalidad, historia, transcripciones de directos. */
  personality: string
  hash: string
  sources: string[]
}

const SUPPORTED_EXTS = new Set(['.docx', '.pdf', '.md', '.txt'])

/** Archivos que ignoramos por ser duplicados o auxiliares. */
const SKIP_BASENAMES = new Set(['MERGEALL.docx'])

/** Carpeta raíz dentro de Cerebro/ que contiene material de personalidad/tono. */
const PERSONALITY_DIR = 'personalidad_lidiane'

async function listSupportedFiles(rootDir: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else {
        if (SKIP_BASENAMES.has(basename(full))) continue
        const lower = entry.name.toLowerCase()
        const dot = lower.lastIndexOf('.')
        if (dot !== -1 && SUPPORTED_EXTS.has(lower.slice(dot))) {
          out.push(full)
        }
      }
    }
  }
  await walk(rootDir)
  return out.sort()
}

function classify(relPath: string): 'knowledge' | 'personality' | 'skip' {
  const normalized = relPath.replaceAll('\\', '/')
  if (normalized.startsWith(`${PERSONALITY_DIR}/`)) {
    // En personality solo aceptamos los .md curados a mano (filosofía + historia).
    // Los PDFs de transcripciones brutas se ignoran: aportan demasiado ruido y peso
    // sin valor proporcional una vez tienes los .md curados.
    if (normalized.endsWith('.md')) return 'personality'
    return 'skip'
  }
  return 'knowledge'
}

export async function buildBrainContent(cerebroDir: string): Promise<BrainContent> {
  const files = await listSupportedFiles(cerebroDir)
  const knowledgeSections: string[] = []
  const personalitySections: string[] = []
  const sources: string[] = []

  for (const fullPath of files) {
    const relPath = relative(cerebroDir, fullPath).replaceAll('\\', '/')
    const cls = classify(relPath)
    if (cls === 'skip') continue

    const text = (await extractText(fullPath)).trim()
    if (!text) continue

    if (cls === 'personality') {
      personalitySections.push(text)
    } else {
      knowledgeSections.push(text)
    }
    sources.push(relPath)
  }

  const knowledge = knowledgeSections.join('\n\n')
  const personality = personalitySections.join('\n\n')

  // Hash incluye ambos para detectar cualquier cambio.
  const hash = createHash('sha256')
    .update(knowledge, 'utf8')
    .update('|', 'utf8')
    .update(personality, 'utf8')
    .digest('hex')

  return { knowledge, personality, hash, sources }
}
