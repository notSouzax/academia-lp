import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = '/cambiar-contrasena'

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: userResult } = await supabase.auth.getUser()
  if (userResult.user) {
    await supabase
      .from('profiles')
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq('user_id', userResult.user.id)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
