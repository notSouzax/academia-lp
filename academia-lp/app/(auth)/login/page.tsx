import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Academia LP</h1>
        <p className="text-sm text-muted-foreground">Entra con tu email y código.</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/recuperar" className="underline hover:text-foreground">
          ¿Has olvidado tu contraseña?
        </Link>
      </p>
    </div>
  )
}
