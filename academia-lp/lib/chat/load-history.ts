import type { UIMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'

const HISTORY_LIMIT = 50

export async function loadInitialHistory(userId: string): Promise<UIMessage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT)
  if (error) throw new Error(`Cannot load history: ${error.message}`)

  const rows = (data ?? []) as Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
  }>

  return rows.reverse().map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.content }] as UIMessage['parts'],
  }))
}
