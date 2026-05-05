'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function validatePasswordStrength(password: string): Promise<string | null> {
  if (!password) return 'La contraseña no puede estar vacía.'
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  return null
}

export async function signInWithPassword(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { ok: false, error: 'Email y contraseña son obligatorios.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { ok: false, error: 'Email o contraseña incorrectos.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  const validation = await validatePasswordStrength(password)
  if (validation) return { ok: false, error: validation }
  if (password !== confirm) return { ok: false, error: 'Las contraseñas no coinciden.' }

  const supabase = await createClient()

  const { data: userResult, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userResult.user) {
    return { ok: false, error: 'No has iniciado sesión.' }
  }

  const { error: updErr } = await supabase.auth.updateUser({ password })
  if (updErr) return { ok: false, error: updErr.message }

  const { error: profErr } = await supabase
    .from('profiles')
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq('user_id', userResult.user.id)

  if (profErr) return { ok: false, error: profErr.message }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { ok: false, error: 'Introduce tu email.' }

  const supabase = await createClient()
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirmar-reset`,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
