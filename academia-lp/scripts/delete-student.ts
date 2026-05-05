import { getAdminClient } from './lib/admin-client'
import { confirm } from './lib/confirm'

function parseEmail(): string {
  const args = process.argv.slice(2)
  const email = args[0]
  if (!email) {
    console.error('Uso: npm run delete-student -- alumna@email.com')
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

  console.log('')
  console.log(`Vas a borrar permanentemente a la alumna ${email} (id: ${user.id}).`)
  console.log('Se borrará: la cuenta, su profile, todos sus mensajes, su resumen y sus fotos.')
  console.log('Esta operación NO se puede deshacer.')
  console.log('')

  const ok = await confirm('¿Continuar?')
  if (!ok) {
    console.log('Cancelado.')
    process.exit(0)
  }

  const supabase = getAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('Error al borrar:', error.message)
    process.exit(2)
  }

  console.log(`Alumna ${email} borrada.`)
}

main().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(99)
})
