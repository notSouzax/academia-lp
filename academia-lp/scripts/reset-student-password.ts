import { getAdminClient } from './lib/admin-client'
import { generateCode } from './lib/code'

function parseEmail(): string {
  const args = process.argv.slice(2)
  const email = args[0]
  if (!email) {
    console.error('Uso: npm run reset-student-password -- alumna@email.com')
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

  const code = generateCode()
  const supabase = getAdminClient()

  const { error: pwErr } = await supabase.auth.admin.updateUserById(user.id, {
    password: code,
  })
  if (pwErr) {
    console.error('Error actualizando contraseña:', pwErr.message)
    process.exit(2)
  }

  const { error: profErr } = await supabase
    .from('profiles')
    .update({ must_change_password: true, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (profErr) {
    console.error('Contraseña actualizada PERO no se pudo marcar must_change_password:', profErr.message)
    console.error('Investiga manualmente. Código nuevo:', code)
    process.exit(3)
  }

  console.log('')
  console.log('  Contraseña reseteada')
  console.log(`  Email:  ${email}`)
  console.log(`  Código nuevo: ${code}`)
  console.log('')
  console.log('  La alumna deberá cambiarla en su próximo login.')
}

main().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(99)
})
