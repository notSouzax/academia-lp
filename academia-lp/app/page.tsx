'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [status, setStatus] = useState<string>('Sin verificar')
  const [loading, setLoading] = useState(false)

  async function checkHealth() {
    setLoading(true)
    setStatus('Verificando…')
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setStatus(JSON.stringify(data, null, 2))
    } catch (err) {
      setStatus(`Error: ${String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Academia LP</h1>
        <p className="mt-2 text-muted-foreground">
          Asistente de IA · Fase 0: Cimientos
        </p>
      </div>
      <Button onClick={checkHealth} disabled={loading}>
        {loading ? 'Verificando…' : 'Verificar conexiones'}
      </Button>
      <pre className="max-w-xl whitespace-pre-wrap break-all rounded-md bg-muted p-4 text-sm">
        {status}
      </pre>
    </main>
  )
}
