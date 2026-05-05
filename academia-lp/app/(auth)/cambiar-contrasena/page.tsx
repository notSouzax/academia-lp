import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChangePasswordForm } from '@/components/auth/change-password-form'

export default async function ChangePasswordPage() {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) redirect('/login')

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Cambia tu contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Antes de continuar, elige una contraseña nueva.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
