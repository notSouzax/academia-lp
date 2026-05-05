import { getAdminClient } from './lib/admin-client'

function parseEmail(): string {
  const args = process.argv.slice(2)
  const email = args[0]
  if (!email) {
    console.error('Uso: npm run student-activity -- alumna@email.com')
    process.exit(1)
  }
  return email.toLowerCase()
}

async function findUserByEmail(email: string) {
  const supabase = getAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw new Error(`No se pudo listar usuarios: ${error.message}`)
  return data.users.find((u) => u.email?.toLowerCase() === email)
}

async function main() {
  const email = parseEmail()
  const user = await findUserByEmail(email)
  if (!user) {
    console.error(`No se ha encontrado ninguna alumna con email ${email}.`)
    process.exit(1)
  }

  const supabase = getAdminClient()

  const { count: messageCount, error: countErr } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (countErr) {
    console.error('Error contando mensajes:', countErr.message)
    process.exit(2)
  }

  const { data: lastRows, error: lastErr } = await supabase
    .from('messages')
    .select('created_at, image_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (lastErr) {
    console.error('Error obteniendo último mensaje:', lastErr.message)
    process.exit(2)
  }

  const { count: photoCount, error: photoErr } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('image_url', 'is', null)

  if (photoErr) {
    console.error('Error contando fotos:', photoErr.message)
    process.exit(2)
  }

  console.log('')
  console.log(`  ${email}`)
  console.log(`  Mensajes totales: ${messageCount ?? 0}`)
  console.log(`  Mensajes con foto: ${photoCount ?? 0}`)
  console.log(
    `  Último mensaje: ${
      lastRows?.[0]?.created_at ? lastRows[0].created_at : 'sin actividad'
    }`
  )
  console.log('')
}

main().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(99)
})
