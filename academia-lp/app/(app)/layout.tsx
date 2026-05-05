import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mustChangePassword } from '@/lib/auth/must-change-password'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()

  if (!userResult.user) redirect('/login')
  if (await mustChangePassword()) redirect('/cambiar-contrasena')

  return <div className="min-h-screen">{children}</div>
}
