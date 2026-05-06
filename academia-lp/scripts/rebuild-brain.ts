import { resolve } from 'node:path'
import { buildBrainContent } from '@/lib/brain/build-content'
import {
  readCacheMeta,
  writeCacheMeta,
  createBrainCache,
  deleteBrainCache,
} from '@/lib/brain/cache-manager'
import { writeBrainFiles } from '@/lib/brain/storage'

function isQuotaError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /RESOURCE_EXHAUSTED|TotalCachedContentStorage|FreeTier/i.test(message)
}

async function main() {
  const cerebroDir = resolve(process.cwd(), '..', 'Cerebro')

  console.log('1) Procesando Cerebro/ ...')
  const built = await buildBrainContent(cerebroDir)
  const knowledgeKB = (built.knowledge.length / 1024).toFixed(1)
  const personalityKB = (built.personality.length / 1024).toFixed(1)
  console.log(`   Archivos procesados: ${built.sources.length}`)
  console.log(`   Conocimiento: ${knowledgeKB} KB`)
  console.log(`   Personalidad: ${personalityKB} KB`)
  console.log(`   Hash combinado: ${built.hash.slice(0, 16)}...`)

  console.log('')
  console.log('2) Guardando archivos compilados (lib/brain/_knowledge.txt, _personality.txt) ...')
  await writeBrainFiles(built.knowledge, built.personality)

  console.log('')
  console.log('3) Comparando con la fila brain_cache_meta ...')
  const previous = await readCacheMeta()

  const sameHash = previous.hash === built.hash
  const stillValid = previous.expiresAt && new Date(previous.expiresAt) > new Date()

  if (sameHash && stillValid && previous.cacheId) {
    console.log('   El Cerebro no ha cambiado y el cache sigue vigente.')
    console.log(`   cache_id: ${previous.cacheId}`)
    console.log(`   expira en: ${previous.expiresAt}`)
    console.log('')
    console.log('Nada que hacer. Salgo.')
    return
  }

  if (previous.cacheId) {
    console.log(`   Borrando cache anterior (${previous.cacheId.slice(-12)}) ...`)
    await deleteBrainCache(previous.cacheId)
  }

  console.log('')
  console.log('4) Intentando subir cache a Gemini (requiere billing activado) ...')

  let cacheId: string | null = null
  let expiresAt: string | null = null

  // Cache combinado: personalidad primero (define tono), luego conocimiento.
  const combinedForCache =
    `# Mi forma de hablar y mi historia (úsalo como tu tono natural)\n\n` +
    built.personality +
    `\n\n# Mi conocimiento (lo que sé y enseño en mi curso)\n\n` +
    built.knowledge

  try {
    const created = await createBrainCache(combinedForCache, built.hash)
    cacheId = created.cacheId
    expiresAt = created.expiresAt
    console.log(`   cache_id: ${cacheId}`)
    console.log(`   expira en: ${expiresAt}`)
  } catch (err) {
    if (isQuotaError(err)) {
      console.log('   El context cache no está disponible (free tier).')
      console.log('   Continúo sin cache: el Cerebro se inyectará en cada llamada al chat.')
      console.log('   Cuando actives billing en Google Cloud, este script creará el cache automáticamente.')
    } else {
      throw err
    }
  }

  console.log('')
  console.log('5) Actualizando brain_cache_meta ...')
  await writeCacheMeta({ cacheId, expiresAt, hash: built.hash })

  console.log('')
  if (cacheId) {
    console.log('Listo. El Cerebro está cacheado y listo para usar en el chat.')
  } else {
    console.log('Listo. El Cerebro está procesado. El chat funcionará sin cache (modo free tier).')
  }
}

main().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(1)
})
