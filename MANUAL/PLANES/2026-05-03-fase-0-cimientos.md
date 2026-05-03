# Fase 0 — Cimientos: Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tener un proyecto Next.js 16 funcionando localmente y desplegado en Vercel con conexión verificada a Supabase y a Gemini, listo para construir encima en la Fase 1.

**Architecture:** Repo Git con Next.js 16 (App Router, TypeScript, Tailwind), Supabase como backend (Auth + DB + Storage) y Gemini 2.5 Flash vía Vercel AI Gateway. Esta fase no implementa lógica de negocio — solo prepara la infraestructura y verifica que todas las piezas se hablan.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Supabase (cliente JS + SSR), AI SDK (`ai`), Vercel AI Gateway, Gemini 2.5 Flash, Vercel CLI.

**Pre-requisitos antes de empezar (acciones humanas):**

1. Tener Node.js 20+ instalado.
2. Tener una cuenta en [github.com](https://github.com), [supabase.com](https://supabase.com) y [vercel.com](https://vercel.com).
3. Tener acceso a la Vercel AI Gateway (se activa al crear cualquier proyecto en Vercel).
4. Tener Git configurado (`git config --global user.name` y `user.email`).

**Sobre TDD en esta fase:** TDD se aplicará desde la Fase 1 (donde hay lógica real). Esta fase es scaffolding/configuración: las "verificaciones" son comprobaciones manuales claras (ej. "abrir esta URL y ver este texto"), no tests automatizados.

---

## Estructura de archivos al final de la Fase 0

```
App Mama/
├── Cerebro/                       (ya existe)
├── MANUAL/                        (ya existe)
├── academia-lp/                   ← nuevo: el proyecto Next.js
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               página "Hola Academia LP"
│   │   ├── globals.css
│   │   └── api/
│   │       └── health/
│   │           └── route.ts       endpoint de verificación
│   ├── components/
│   │   └── ui/                    componentes shadcn
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          cliente browser
│   │   │   ├── server.ts          cliente server
│   │   │   └── middleware.ts      refresco de sesión
│   │   └── ai.ts                  cliente Gemini vía AI Gateway
│   ├── scripts/
│   │   └── README.md              placeholder
│   ├── middleware.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── package.json
│   ├── .env.local                 (gitignored)
│   ├── .env.example
│   ├── .gitignore
│   └── README.md
```

---

## Task 1: Inicializar repositorio Git y crear proyecto Next.js

**Files:**
- Create: `academia-lp/` (proyecto entero)
- Create: `academia-lp/.gitignore`
- Create raíz: `.gitignore` (a nivel de "App Mama" para excluir `node_modules`, `.env*`, `.next`)

- [ ] **Step 1: Inicializar git en la raíz del proyecto**

Asegúrate de estar en `c:\Users\notso\Documents\App Mama`:

```powershell
git init
git branch -M main
```

- [ ] **Step 2: Añadir un .gitignore raíz que cubra el monorepo**

Crear `c:\Users\notso\Documents\App Mama\.gitignore` con:

```gitignore
# Dependencies
**/node_modules/

# Next.js
**/.next/
**/out/

# Environment
**/.env
**/.env.local
**/.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Backups
backups/
```

- [ ] **Step 3: Crear el proyecto Next.js**

```powershell
npx create-next-app@latest academia-lp --typescript --tailwind --eslint --app --no-src-dir --import-alias="@/*" --turbopack
```

Si pide alguna respuesta interactiva, contesta:
- TypeScript: Yes
- ESLint: Yes
- Tailwind: Yes
- `src/` directory: No
- App Router: Yes
- Turbopack: Yes
- Customize import alias: No (usa `@/*`)

- [ ] **Step 4: Verificar que arranca localmente**

```powershell
cd academia-lp
npm run dev
```

Expected: ver en consola "Ready in Xms" y al abrir `http://localhost:3000` ver la pantalla de bienvenida de Next.js.

Detén el servidor con `Ctrl+C`.

- [ ] **Step 5: Commit inicial**

```powershell
cd ..
git add .
git commit -m "chore: scaffold Next.js 16 project with TypeScript and Tailwind"
```

---

## Task 2: Configurar shadcn/ui

**Files:**
- Modify: `academia-lp/components.json` (creado por shadcn init)
- Create: `academia-lp/components/ui/button.tsx`

- [ ] **Step 1: Inicializar shadcn/ui**

Desde `c:\Users\notso\Documents\App Mama\academia-lp`:

```powershell
npx shadcn@latest init
```

Responde:
- Style: Default
- Base color: Neutral (luego se cambia con la paleta de la profesora)
- CSS variables: Yes

- [ ] **Step 2: Añadir el componente Button**

```powershell
npx shadcn@latest add button
```

Verifica que se ha creado `academia-lp/components/ui/button.tsx`.

- [ ] **Step 3: Verificar que sigue arrancando**

```powershell
npm run dev
```

Abre `http://localhost:3000`. Debe seguir mostrando la pantalla de bienvenida sin errores. `Ctrl+C` para detener.

- [ ] **Step 4: Commit**

```powershell
cd ..
git add academia-lp
git commit -m "chore: configure shadcn/ui with button component"
```

---

## Task 3: Crear proyecto Supabase y configurar variables de entorno

> **Acción humana primero:** entra en [supabase.com](https://supabase.com), crea un proyecto nuevo llamado **`academia-lp`**, región más cercana a España (Frankfurt o Londres), y guarda los datos. Una vez creado, ve a *Project Settings → API* y copia: `Project URL`, `anon public key`, y `service_role key`.

**Files:**
- Create: `academia-lp/.env.local`
- Create: `academia-lp/.env.example`

- [ ] **Step 1: Crear `.env.example` (versionable)**

Crear `academia-lp/.env.example` con:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI - Vercel AI Gateway
AI_GATEWAY_API_KEY=your-ai-gateway-key

# AI - Google directo (para context cache de Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key
```

- [ ] **Step 2: Crear `.env.local` con valores reales**

Crear `academia-lp/.env.local` rellenando con los valores reales del proyecto Supabase recién creado. Las claves de AI las añadiremos en tasks posteriores.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

AI_GATEWAY_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

- [ ] **Step 3: Verificar que `.env.local` está ignorado**

```powershell
git status
```

Expected: `.env.local` NO aparece en la lista. Si aparece, revisa el `.gitignore` raíz.

- [ ] **Step 4: Commit**

```powershell
cd ..
git add academia-lp/.env.example
git commit -m "chore: add env.example with required variables"
```

---

## Task 4: Instalar y configurar cliente Supabase

**Files:**
- Create: `academia-lp/lib/supabase/client.ts`
- Create: `academia-lp/lib/supabase/server.ts`
- Create: `academia-lp/lib/supabase/middleware.ts`
- Create: `academia-lp/middleware.ts`

- [ ] **Step 1: Instalar dependencias**

Desde `academia-lp/`:

```powershell
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Crear `lib/supabase/client.ts` (cliente browser)**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Crear `lib/supabase/server.ts` (cliente server)**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Llamado desde Server Component — ignorable si hay middleware refrescando.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Crear `lib/supabase/middleware.ts` (refresco de sesión)**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}
```

- [ ] **Step 5: Crear `middleware.ts` raíz del proyecto**

En `academia-lp/middleware.ts`:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 6: Verificar que sigue compilando**

```powershell
npm run dev
```

Abre `http://localhost:3000`. No deben salir errores en consola del servidor. `Ctrl+C` para detener.

- [ ] **Step 7: Commit**

```powershell
cd ..
git add academia-lp
git commit -m "feat: configure Supabase clients and session middleware"
```

---

## Task 5: Instalar AI SDK y crear cliente Gemini

> **Acción humana primero:** entra en [vercel.com/dashboard](https://vercel.com/dashboard), Settings → AI Gateway, y genera una API key. Cópiala y pégala en `.env.local` como `AI_GATEWAY_API_KEY`.
> Adicionalmente: entra en [aistudio.google.com](https://aistudio.google.com), Get API key → Create API key, y guárdala como `GOOGLE_GENERATIVE_AI_API_KEY` en `.env.local` (la usaremos para el context cache en la Fase 1).

**Files:**
- Create: `academia-lp/lib/ai.ts`

- [ ] **Step 1: Instalar AI SDK y proveedor**

Desde `academia-lp/`:

```powershell
npm install ai
```

(El AI SDK de Vercel v6 incluye soporte para AI Gateway por defecto sin necesidad de un paquete de proveedor adicional.)

- [ ] **Step 2: Crear `lib/ai.ts`**

```typescript
import { generateText, streamText } from 'ai'

export const CHAT_MODEL = 'google/gemini-2.5-flash'

export async function generateOnce(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: CHAT_MODEL,
    prompt,
  })
  return text
}

export { streamText }
```

- [ ] **Step 3: Commit**

```powershell
cd ..
git add academia-lp
git commit -m "feat: install AI SDK and create Gemini client wrapper"
```

---

## Task 6: Crear endpoint de salud que verifica conexiones

**Files:**
- Create: `academia-lp/app/api/health/route.ts`

- [ ] **Step 1: Crear el endpoint**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOnce } from '@/lib/ai'

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}

  // Supabase: probamos a obtener el usuario (debe ser null sin sesión, pero sin error)
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.getUser()
    checks.supabase = { ok: !error, detail: error?.message }
  } catch (err) {
    checks.supabase = { ok: false, detail: String(err) }
  }

  // Gemini: una llamada mínima
  try {
    const text = await generateOnce(
      'Responde solo con la palabra OK, sin nada más.'
    )
    checks.gemini = { ok: text.toLowerCase().includes('ok'), detail: text }
  } catch (err) {
    checks.gemini = { ok: false, detail: String(err) }
  }

  const allOk = Object.values(checks).every((c) => c.ok)
  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks },
    { status: allOk ? 200 : 503 }
  )
}
```

- [ ] **Step 2: Probar el endpoint localmente**

```powershell
npm run dev
```

En otra terminal o en el navegador, abre `http://localhost:3000/api/health`.

Expected (JSON):

```json
{
  "status": "ok",
  "checks": {
    "supabase": { "ok": true },
    "gemini": { "ok": true, "detail": "OK" }
  }
}
```

Si alguno falla:
- `supabase: ok: false` → revisa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`.
- `gemini: ok: false` → revisa `AI_GATEWAY_API_KEY`. Si el error menciona modelo no encontrado, prueba con `'google/gemini-2.5-flash-preview'` o el ID actualizado en la documentación de Vercel AI Gateway.

`Ctrl+C` para detener cuando esté OK.

- [ ] **Step 3: Commit**

```powershell
cd ..
git add academia-lp
git commit -m "feat: add /api/health endpoint verifying Supabase and Gemini connections"
```

---

## Task 7: Crear página principal "Hola Academia LP"

**Files:**
- Modify: `academia-lp/app/page.tsx`
- Modify: `academia-lp/app/layout.tsx`

- [ ] **Step 1: Reemplazar `app/page.tsx`**

```tsx
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
```

- [ ] **Step 2: Actualizar metadata en `app/layout.tsx`**

Localiza el bloque `export const metadata` y reemplázalo por:

```tsx
export const metadata = {
  title: 'Academia LP',
  description: 'Asistente de IA sobre micropigmentación de cejas',
}
```

- [ ] **Step 3: Probar localmente**

```powershell
npm run dev
```

Abre `http://localhost:3000`. Debes ver:
- Título "Academia LP".
- Botón "Verificar conexiones".

Pulsa el botón. Tras unos segundos debe mostrar el JSON con `"status": "ok"` y los dos checks en true.

`Ctrl+C` para detener.

- [ ] **Step 4: Commit**

```powershell
cd ..
git add academia-lp
git commit -m "feat: add landing page with connection check button"
```

---

## Task 8: Crear repositorio GitHub y subir el código

> **Acción humana:** entra en [github.com](https://github.com) y crea un repo **privado** llamado `academia-lp` (o el nombre que prefieras). NO lo inicialices con README, gitignore ni licencia.

- [ ] **Step 1: Conectar con el remoto**

Desde la raíz del proyecto (`c:\Users\notso\Documents\App Mama`):

```powershell
git remote add origin https://github.com/TU-USUARIO/academia-lp.git
```

(Reemplaza `TU-USUARIO` por tu usuario de GitHub.)

- [ ] **Step 2: Push inicial**

```powershell
git push -u origin main
```

Si pide autenticación, usa un Personal Access Token (Settings → Developer settings → Personal access tokens) o el GitHub CLI (`gh auth login`).

- [ ] **Step 3: Verificar en GitHub**

Abre `https://github.com/TU-USUARIO/academia-lp` y comprueba que el código está subido.

---

## Task 9: Desplegar en Vercel

> **Acción humana antes:** instala la Vercel CLI si no la tienes:
> ```powershell
> npm i -g vercel
> vercel login
> ```

- [ ] **Step 1: Crear proyecto en Vercel desde la web**

Entra en [vercel.com/new](https://vercel.com/new), selecciona el repo `academia-lp` recién creado, y haz clic en "Import".

En la pantalla de configuración:
- **Framework Preset:** Next.js (autodetectado).
- **Root Directory:** `academia-lp` (si tu monorepo lo requiere — pulsa "Edit" y selecciónalo).
- **Build Command:** dejar el default.
- **Environment Variables:** añade las cuatro de `.env.local` (sin las comillas):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `AI_GATEWAY_API_KEY`
  - `GOOGLE_GENERATIVE_AI_API_KEY`

Pulsa "Deploy".

- [ ] **Step 2: Esperar al despliegue (1-3 minutos)**

Cuando termine, Vercel te muestra una URL tipo `academia-lp-xxx.vercel.app`.

- [ ] **Step 3: Verificar el deploy**

Abre la URL en el navegador. Debes ver la página "Academia LP". Pulsa "Verificar conexiones" — debe responder con `"status": "ok"`.

Si `gemini` falla en producción pero funciona en local: revisa que `AI_GATEWAY_API_KEY` está bien copiada en Vercel (sin espacios extras al final). Tras corregir, fuerza redeploy desde *Deployments → ... → Redeploy*.

- [ ] **Step 4: Linkear el proyecto local con la CLI**

Desde `academia-lp/`:

```powershell
vercel link
```

Responde:
- Set up "academia-lp"? Yes
- Which scope? (tu usuario o team)
- Link to existing project? Yes
- What's the name of your existing project? `academia-lp`

Esto crea `academia-lp/.vercel/` (ya gitignored por defecto).

- [ ] **Step 5: Verificar que `vercel env pull` funciona**

```powershell
vercel env pull .env.local
```

Debe regenerar el `.env.local` con todas las variables que pusiste en Vercel. Esto será útil cuando trabajes desde otra máquina.

---

## Task 10: Crear estructura de scripts y README final

**Files:**
- Create: `academia-lp/scripts/README.md`
- Modify: `academia-lp/README.md`

- [ ] **Step 1: Crear `scripts/README.md`**

```markdown
# Scripts de administración

Esta carpeta contendrá scripts ejecutables con `npm run` para tareas operativas:

- `create-student.ts` — dar de alta una alumna nueva (Fase 1).
- `delete-student.ts` — borrar una alumna y todos sus datos (Fase 1).
- `list-students.ts` — listar alumnas activas (Fase 1).
- `reset-student-password.ts` — generar un código nuevo (Fase 1).
- `rebuild-brain.ts` — regenerar el context cache de Gemini (Fase 1).
- `student-activity.ts` — diagnóstico de actividad (Fase 1).
- `export-student-data.ts` — exportar datos de una alumna (RGPD) (Fase 3).
- `backup-db.ts` — backup manual de la BD (Fase 3).

Todos requieren `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` y se ejecutan localmente, nunca desplegados.
```

- [ ] **Step 2: Reemplazar el `README.md` autogenerado por uno propio**

```markdown
# Academia LP

Asistente de IA sobre micropigmentación de cejas (nanoblading).

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Supabase (Auth, DB, Storage)
- Gemini 2.5 Flash vía Vercel AI Gateway
- Desplegado en Vercel

## Arrancar localmente

1. Clonar el repo y entrar en `academia-lp/`.
2. Instalar dependencias: `npm install`.
3. Crear `.env.local` con las variables (ver `.env.example`). Si tienes acceso al proyecto de Vercel, ejecuta `vercel env pull .env.local`.
4. `npm run dev` y abrir `http://localhost:3000`.

## Verificación de conexiones

`GET /api/health` devuelve el estado de Supabase y Gemini. La página principal tiene un botón que lo invoca.

## Documentación

Toda la información operativa, decisiones de diseño, planes de implementación y FAQ vive en la carpeta `MANUAL/` (un nivel arriba en el monorepo).

## Despliegue

Push a `main` → deploy automático en Vercel. Variables de entorno se configuran en el dashboard de Vercel.
```

- [ ] **Step 3: Commit final de la fase**

```powershell
cd ..
git add academia-lp
git commit -m "docs: add project README and scripts placeholder"
git push
```

---

## Verificación final de la Fase 0

Antes de declarar la fase completada, comprueba:

- [ ] `npm run dev` arranca sin errores y `http://localhost:3000` muestra la página "Academia LP".
- [ ] El botón "Verificar conexiones" devuelve `"status": "ok"` en local.
- [ ] La URL de producción (`*.vercel.app`) muestra la misma página y el botón también devuelve `"status": "ok"`.
- [ ] El repo de GitHub está sincronizado con `main`.
- [ ] `vercel env pull .env.local` funciona.
- [ ] Ningún archivo `.env.local` ha sido commiteado.

Cuando todo esto sea verde, la Fase 0 está terminada y podemos pasar al plan de la **Fase 1 — MVP texto**.
