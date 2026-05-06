import type { SupabaseClient } from '@supabase/supabase-js'

export async function saveMessage(
  supabase: SupabaseClient,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  imageUrl: string | null = null
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    user_id: userId,
    role,
    content,
    image_url: imageUrl,
  })
  if (error) throw new Error(`Cannot save message: ${error.message}`)
}
