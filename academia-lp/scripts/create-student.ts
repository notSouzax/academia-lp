import { getAdminClient } from './lib/admin-client'
import { generateCode } from './lib/code'

function parseEmail(): string {
  const args = process.argv.slice(2)
  const email = args[0]
  if (!email) {
    console.error('Uso: npm run create-student -- alumna@email.com')
    process.exit(1)
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error(`Email no válido: ${email}`)
    process.exit(1)
  }
  return email.toLowerCase()
}

async function main() {
  const email = parseEmail()
  const code = generateCode()
  const supabase = getAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: code,
    email_confirm: true,
  })

  if (error) {
    console.error('Error al crear el usuario:', error.message)
    process.exit(2)
  }
  if (!data.user) {
    console.error('Usuario no creado (sin error pero sin user devuelto).')
    process.exit(2)
  }

  console.log('')
  console.log('  Alumna creada')
  console.log(`  Email:  ${email}`)
  console.log(`  Código: ${code}`)
  console.log('')
  console.log('  Pasa estos datos a la profesora.')
}

main().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(99)
})
