import Link from 'next/link'
import { RecoverForm } from '@/components/auth/recover-form'

export default function RecoverPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un enlace a tu email.
        </p>
      </div>
      <RecoverForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline hover:text-foreground">
          Volver a entrar
        </Link>
      </p>
    </div>
  )
}
