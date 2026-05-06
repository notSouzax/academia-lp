import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ChatView } from '@/components/chat/chat-view'
import { loadInitialHistory } from '@/lib/chat/load-history'

export default async function PrivateHome() {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  const email = userResult.user?.email ?? ''
  const initialMessages = userResult.user
    ? await loadInitialHistory(userResult.user.id)
    : []

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col">
      <header className="flex shrink-0 items-center justify-between border-b p-4">
        <div>
          <h1 className="text-lg font-semibold leading-none">Academia LP</h1>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Salir
          </Button>
        </form>
      </header>
      <div className="min-h-0 flex-1">
        <ChatView initialMessages={initialMessages} />
      </div>
    </main>
  )
}
