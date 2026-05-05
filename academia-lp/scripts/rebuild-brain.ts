import { resolve } from 'node:path'
import { buildBrainContent } from '@/lib/brain/build-content'
import {
  readCacheMeta,
  writeCacheMeta,
  createBrainCache,
  deleteBrainCache,
} from '@/lib/brain/cache-manager'

async function main() {
  const cerebroDir = resolve(process.cwd(), '..', 'Cerebro')

  console.log('1) Procesando Cerebro/ ...')
  const built = await buildBrainContent(cerebroDir)
  console.log(`   Archivos: ${built.sources.length}`)
  console.log(`   Tamaño texto: ${(built.content.length / 1024).toFixed(1)} KB`)
  console.log(`   Hash: ${built.hash.slice(0, 16)}...`)

  console.log('')
  console.log('2) Comparando con la fila brain_cache_meta ...')
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
  console.log('3) Subiendo nuevo cache a Gemini ...')
  const { cacheId, expiresAt } = await createBrainCache(built.content, built.hash)
  console.log(`   cache_id: ${cacheId}`)
  console.log(`   expira en: ${expiresAt}`)

  console.log('')
  console.log('4) Actualizando brain_cache_meta ...')
  await writeCacheMeta({ cacheId, expiresAt, hash: built.hash })

  console.log('')
  console.log('Listo. El Cerebro está cacheado y listo para usar en el chat.')
}

main().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(1)
})
