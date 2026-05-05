import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function PrivateHome() {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  const email = userResult.user?.email ?? ''

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Academia LP</h1>
        <form action={signOut}>
          <Button type="submit" variant="outline">Cerrar sesión</Button>
        </form>
      </header>
      <section className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">Hola {email}</p>
        <p className="mt-2">
          El chat estará disponible al terminar la Fase 1B. De momento ya tienes acceso autenticado y la sesión está activa.
        </p>
      </section>
    </main>
  )
}
