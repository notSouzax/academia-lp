import { getAdminClient } from './lib/admin-client'

type Row = {
  email: string
  created_at: string
  must_change_password: boolean
  display_name: string | null
}

async function main() {
  const supabase = getAdminClient()

  const { data: users, error: authErr } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  })
  if (authErr) {
    console.error('Error listando users:', authErr.message)
    process.exit(2)
  }

  const ids = users.users.map((u) => u.id)
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('user_id, display_name, must_change_password')
    .in('user_id', ids)

  if (profErr) {
    console.error('Error listando profiles:', profErr.message)
    process.exit(2)
  }

  const profileByUserId = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  )

  const rows: Row[] = users.users.map((u) => {
    const p = profileByUserId.get(u.id)
    return {
      email: u.email ?? '(sin email)',
      created_at: u.created_at ?? '',
      must_change_password: p?.must_change_password ?? false,
      display_name: p?.display_name ?? null,
    }
  })

  rows.sort((a, b) => a.created_at.localeCompare(b.created_at))

  if (rows.length === 0) {
    console.log('No hay alumnas registradas.')
    return
  }

  console.log('')
  console.log(`Total: ${rows.length} alumna(s)`)
  console.log('')
  for (const r of rows) {
    const date = r.created_at.slice(0, 10)
    const flag = r.must_change_password ? '[código provisional]' : ''
    const name = r.display_name ? ` "${r.display_name}"` : ''
    console.log(`  ${date}  ${r.email}${name}  ${flag}`)
  }
  console.log('')
}

main().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(99)
})
