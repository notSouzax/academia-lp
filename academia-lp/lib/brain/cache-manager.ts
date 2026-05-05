import { GoogleGenAI } from '@google/genai'
import { getAdminClient } from '@/scripts/lib/admin-client'

export type CacheMeta = {
  cacheId: string | null
  expiresAt: string | null
  hash: string | null
}

// gemini-2.5-flash has limit=0 for context caching on the free tier (limit=0 means not available).
// gemini-2.0-flash-001 supports context caching on free/paid tiers per SDK docs.
const MODEL_ID = 'gemini-2.0-flash-001'
const DEFAULT_TTL_SECONDS = 3600 // 1h

let cachedClient: GoogleGenAI | null = null

function getGenAI(): GoogleGenAI {
  if (cachedClient) return cachedClient
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY in env.')
  cachedClient = new GoogleGenAI({ apiKey })
  return cachedClient
}

export async function readCacheMeta(): Promise<CacheMeta> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('brain_cache_meta')
    .select('cache_id, cache_expires_at, brain_hash')
    .eq('id', 1)
    .single()
  if (error) throw new Error(`Cannot read brain_cache_meta: ${error.message}`)
  return {
    cacheId: data.cache_id,
    expiresAt: data.cache_expires_at,
    hash: data.brain_hash,
  }
}

export async function writeCacheMeta(meta: CacheMeta): Promise<void> {
  const supabase = getAdminClient()
  const { error } = await supabase
    .from('brain_cache_meta')
    .update({
      cache_id: meta.cacheId,
      cache_expires_at: meta.expiresAt,
      brain_hash: meta.hash,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
  if (error) throw new Error(`Cannot write brain_cache_meta: ${error.message}`)
}

export async function createBrainCache(
  content: string,
  hash: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<{ cacheId: string; expiresAt: string }> {
  const genAI = getGenAI()

  // SDK v1.52: caches.create({ model, config: { contents, ttl, displayName } })
  // Returns CachedContent with .name (resource name) and .expireTime (ISO string)
  const created = await genAI.caches.create({
    model: MODEL_ID,
    config: {
      contents: [
        {
          role: 'user',
          parts: [{ text: content }],
        },
      ],
      ttl: `${ttlSeconds}s`,
      displayName: `cerebro-${hash.slice(0, 8)}`,
    },
  })

  if (!created.name) {
    throw new Error('Gemini did not return a cache name.')
  }

  const expiresAt = created.expireTime ?? new Date(Date.now() + ttlSeconds * 1000).toISOString()

  return { cacheId: created.name, expiresAt }
}

export async function deleteBrainCache(cacheId: string): Promise<void> {
  const genAI = getGenAI()
  try {
    // SDK v1.52: caches.delete({ name: cacheId })
    await genAI.caches.delete({ name: cacheId })
  } catch (err) {
    console.warn(`(no se pudo borrar cache ${cacheId}, probablemente ya caducó):`, err)
  }
}
