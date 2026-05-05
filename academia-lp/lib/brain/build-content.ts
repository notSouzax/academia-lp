import { readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { extractText } from './extract'

export type BrainContent = {
  content: string
  hash: string
  sources: string[]
}

const SUPPORTED_EXTS = new Set(['.docx', '.pdf'])

async function listSupportedFiles(rootDir: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else {
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

export async function buildBrainContent(cerebroDir: string): Promise<BrainContent> {
  const files = await listSupportedFiles(cerebroDir)
  const sections: string[] = []
  const sources: string[] = []

  for (const fullPath of files) {
    const relPath = relative(cerebroDir, fullPath).replaceAll('\\', '/')
    const text = await extractText(fullPath)
    sections.push(`## ${relPath}\n\n${text.trim()}`)
    sources.push(relPath)
  }

  const content = sections.join('\n\n---\n\n')
  const hash = createHash('sha256').update(content, 'utf8').digest('hex')

  return { content, hash, sources }
}
