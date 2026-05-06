export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type ChatContext = {
  summary: string
  messages: ChatMessage[]
}

export type SupabaseLike = {
  from(table: string): {
    select(cols: string): {
      eq(col: string, value: string): {
        order?(col: string, opts: { ascending: boolean }): {
          limit(n: number): Promise<{ data: unknown; error: unknown }>
        }
        maybeSingle?(): Promise<{ data: unknown; error: unknown }>
      }
    }
  }
}

export async function buildChatContext(
  supabase: SupabaseLike,
  userId: string,
  recentLimit: number
): Promise<ChatContext> {
  const messagesQuery = supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
  const ordered = messagesQuery.order!('created_at', { ascending: false })
  const { data: recentDesc, error: msgErr } = await ordered.limit(recentLimit)
  if (msgErr) throw new Error(`Cannot read messages: ${String(msgErr)}`)

  const recentRows = (recentDesc as Array<{ role: 'user' | 'assistant'; content: string }>) ?? []
  const messages: ChatMessage[] = [...recentRows].reverse().map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const summaryQuery = supabase
    .from('conversation_summaries')
    .select('summary')
    .eq('user_id', userId)
  const { data: summaryData, error: sumErr } = await summaryQuery.maybeSingle!()
  if (sumErr) throw new Error(`Cannot read summary: ${String(sumErr)}`)

  const summary = (summaryData as { summary?: string } | null)?.summary ?? ''

  return { summary, messages }
}
