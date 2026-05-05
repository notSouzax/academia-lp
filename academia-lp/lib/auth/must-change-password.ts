import { createClient } from '@/lib/supabase/server'

export async function mustChangePassword(): Promise<boolean> {
  const supabase = await createClient()
  const { data: userResult, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userResult.user) return false

  const { data, error } = await supabase
    .from('profiles')
    .select('must_change_password')
    .eq('user_id', userResult.user.id)
    .single()

  if (error || !data) return false
  return data.must_change_password === true
}
