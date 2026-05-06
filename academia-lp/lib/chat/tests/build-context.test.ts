import { describe, expect, it } from 'vitest'
import { buildChatContext, type SupabaseLike } from '../build-context'

function fakeSupabase(rows: {
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }>
  summary: string
}): SupabaseLike {
  return {
    from(table: string) {
      if (table === 'messages') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: [...rows.messages].reverse(), error: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<SupabaseLike['from']>
      }
      if (table === 'conversation_summaries') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: rows.summary ? { summary: rows.summary } : null,
                error: null,
              }),
            }),
          }),
        } as unknown as ReturnType<SupabaseLike['from']>
      }
      throw new Error(`unexpected table: ${table}`)
    },
  }
}

describe('buildChatContext', () => {
  it('returns recent messages in chronological order plus summary', async () => {
    const sb = fakeSupabase({
      messages: [
        { id: 'a', role: 'user', content: 'hola', created_at: '2026-05-06T10:00:00Z' },
        { id: 'b', role: 'assistant', content: 'hola, ¿qué tal?', created_at: '2026-05-06T10:00:05Z' },
      ],
      summary: 'Resumen previo de la conversación',
    })

    const ctx = await buildChatContext(sb, 'user-1', 15)

    expect(ctx.summary).toBe('Resumen previo de la conversación')
    expect(ctx.messages).toEqual([
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'hola, ¿qué tal?' },
    ])
  })

  it('returns empty summary when none exists', async () => {
    const sb = fakeSupabase({ messages: [], summary: '' })
    const ctx = await buildChatContext(sb, 'user-1', 15)
    expect(ctx.summary).toBe('')
    expect(ctx.messages).toEqual([])
  })
})
