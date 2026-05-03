import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOnce } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}

  // Supabase: getUser should succeed (returns null user, no error) when no session.
  // "Auth session missing!" is a non-error state — it means the connection works but no user is logged in.
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.getUser()
    const isOk = !error || error.message === 'Auth session missing!'
    checks.supabase = { ok: isOk, detail: error?.message }
  } catch (err) {
    checks.supabase = { ok: false, detail: String(err) }
  }

  // Gemini: minimal call to confirm gateway + model work.
  try {
    const text = await generateOnce(
      'Responde solo con la palabra OK, sin nada más.'
    )
    checks.gemini = { ok: text.toLowerCase().includes('ok'), detail: text }
  } catch (err) {
    checks.gemini = { ok: false, detail: String(err) }
  }

  const allOk = Object.values(checks).every((c) => c.ok)
  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks },
    { status: allOk ? 200 : 503 }
  )
}
