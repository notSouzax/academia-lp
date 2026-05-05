import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Index() {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (userResult.user) {
    redirect('/inicio')
  } else {
    redirect('/login')
  }
}
