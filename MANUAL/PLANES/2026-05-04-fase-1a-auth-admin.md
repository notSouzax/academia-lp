# Fase 1A — Auth y administración de alumnas: Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una alumna real puede ser dada de alta por el operador con un comando, recibir su email + código provisional, iniciar sesión en la app, y ser forzada a cambiar la contraseña antes de poder acceder a la zona privada (todavía vacía — el chat se construye en Fase 1B).

**Architecture:** Migraciones SQL en Supabase (4 tablas + RLS + trigger profile-on-signup), scripts Node ejecutables con `tsx` que usan la `service_role` para operaciones admin (crear/borrar/listar/resetear), páginas de Next.js para el flujo de auth (login, cambio de contraseña forzado, reset por email), y un layout `(app)` que protege todas las rutas privadas.

**Tech Stack:** Supabase Postgres + Auth + RLS, Next.js 16 App Router (Server Actions, route groups), `@supabase/ssr` (ya configurado), `tsx` para los scripts, shadcn/ui para los formularios.

**Pre-requisitos antes de empezar:**

1. Fase 0 completada (proyecto local arranca, `/api/health` responde "ok").
2. Acceso al proyecto Supabase (`https://riglsvusrrypgtbntewu.supabase.co`) con su `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.
3. En el panel de Supabase, **Auth → URL Configuration** deja `Site URL = http://localhost:3000` durante toda esta fase (cuando se reactive el deploy en Vercel se añade la URL pública también).

**Sobre TDD en esta fase:** Las migraciones SQL y los formularios visuales no se prestan a TDD puro. Aplicaremos TDD de forma pragmática:
- **Scripts admin (lib + comandos):** TDD estricto — los helpers (`generateCode`, `parseEmailArg`) y la lógica de cada script tienen pruebas unitarias con `vitest`.
- **Server actions (login, change-password, reset):** pruebas unitarias para la rama feliz y los casos de error claros.
- **UI:** verificación manual con la app corriendo (la guía explícita está en cada task).

---

## Estructura de archivos al final de la Fase 1A

```
academia-lp/
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql
├── scripts/
│   ├── lib/
│   │   ├── env.ts                load-env helper
│   │   ├── admin-client.ts       Supabase con service_role
│   │   ├── code.ts               generador de código NARDO-XXXX
│   │   ├── confirm.ts            confirmación interactiva (readline)
│   │   └── tests/
│   │       ├── code.test.ts
│   │       └── env.test.ts
│   ├── create-student.ts
│   ├── delete-student.ts
│   ├── list-students.ts
│   ├── reset-student-password.ts
│   └── student-activity.ts
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx            shell mínimo para login/recuperar
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── cambiar-contrasena/
│   │   │   └── page.tsx
│   │   └── recuperar/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx            verifica sesión + must_change_password
│   │   └── page.tsx              landing privada (placeholder hacia /chat de Fase 1B)
│   ├── auth/
│   │   └── confirmar-reset/
│   │       └── route.ts          handler del enlace que llega por email
│   ├── api/
│   │   └── health/
│   │       └── route.ts          (existe)
│   ├── layout.tsx                (existe — root)
│   └── page.tsx                  (existe — la convertimos en redirect inteligente)
├── lib/
│   ├── auth/
│   │   ├── actions.ts            server actions: signIn, signOut, changePassword, requestReset
│   │   ├── must-change-password.ts
│   │   └── tests/
│   │       └── actions.test.ts
│   └── supabase/                 (existe — Fase 0)
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── change-password-form.tsx
│   │   └── recover-form.tsx
│   └── ui/                       (existe — Fase 0; añadiremos input + label)
├── vitest.config.ts
└── package.json                  (añadiremos: tsx, vitest, @types/node, @vitest/expect, etc.)
```

---

## Task 1: Setup de tsx y vitest

**Files:**
- Modify: `academia-lp/package.json`
- Create: `academia-lp/vitest.config.ts`

- [ ] **Step 1: Instalar dependencias dev**

Desde `academia-lp/`:
```
npm install -D tsx vitest @vitest/expect
```

- [ ] **Step 2: Añadir scripts a package.json**

Modifica `academia-lp/package.json` y reemplaza la sección `"scripts"` por:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "create-student": "tsx scripts/create-student.ts",
  "delete-student": "tsx scripts/delete-student.ts",
  "list-students": "tsx scripts/list-students.ts",
  "reset-student-password": "tsx scripts/reset-student-password.ts",
  "student-activity": "tsx scripts/student-activity.ts"
},
```

- [ ] **Step 3: Crear `academia-lp/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/tests/**/*.test.ts', '**/__tests__/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Verificar**

```
npx vitest run --passWithNoTests
```

Expected: `No test files found, exiting with code 0` (o similar). Confirma que vitest arranca sin error.

- [ ] **Step 5: Commit**

```
git add academia-lp/package.json academia-lp/package-lock.json academia-lp/vitest.config.ts
git commit -m "chore: setup tsx and vitest for admin scripts"
```

---

## Task 2: Migración inicial de schema (4 tablas + RLS + trigger)

**Files:**
- Create: `academia-lp/supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Crear el archivo de migración**

`academia-lp/supabase/migrations/0001_initial_schema.sql`:

```sql
-- =========================================================
-- 0001_initial_schema.sql
-- Tablas iniciales de Academia LP + RLS + trigger profile-on-signup.
-- =========================================================

-- ---------- profiles ----------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Own profile read"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Own profile update"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: cada vez que se crea un user, se crea su profile automáticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, must_change_password)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', null), true);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- messages ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create index messages_user_id_created_at_idx
  on public.messages(user_id, created_at);

alter table public.messages enable row level security;

create policy "Own messages all"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- conversation_summaries ----------
create table public.conversation_summaries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  summary text not null default '',
  last_summarized_message_id uuid references public.messages(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.conversation_summaries enable row level security;

create policy "Own summary all"
  on public.conversation_summaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- brain_cache_meta ----------
-- Singleton: una sola fila con id=1 para los metadatos del context cache de Gemini.
create table public.brain_cache_meta (
  id integer primary key default 1 check (id = 1),
  cache_id text,
  cache_expires_at timestamptz,
  brain_hash text,
  updated_at timestamptz not null default now()
);

-- Esta tabla NO tiene RLS pública: solo se accede desde el servidor con service_role
-- (los clientes nunca leen ni escriben aquí directamente). Por seguridad, sí activamos
-- RLS y dejamos la tabla bloqueada para todos los roles excepto service_role.
alter table public.brain_cache_meta enable row level security;
-- (sin policies → nadie puede leer/escribir; service_role omite RLS por defecto)

-- Insertar la fila singleton vacía
insert into public.brain_cache_meta (id) values (1);
```

- [ ] **Step 2: Aplicar la migración en Supabase (acción humana)**

1. Entra en [supabase.com](https://supabase.com) → tu proyecto `academia-lp`.
2. Sidebar izquierda → **SQL Editor**.
3. Pulsa **"+ New query"**.
4. Copia el contenido de `0001_initial_schema.sql` completo y pégalo.
5. Pulsa **"Run"** (Ctrl+Enter).
6. Debe terminar sin errores. Si hay algún error, cópialo aquí y resolvemos.

- [ ] **Step 3: Verificar en el Studio**

Sidebar → **Table Editor**: deben aparecer las 4 tablas: `profiles`, `messages`, `conversation_summaries`, `brain_cache_meta`. La tabla `brain_cache_meta` debe tener una fila con `id=1` y el resto de columnas vacías.

Sidebar → **Authentication → Policies**: debes ver las policies "Own profile read", "Own profile update", "Own messages all", "Own summary all".

- [ ] **Step 4: Commit**

```
git add academia-lp/supabase/migrations/0001_initial_schema.sql
git commit -m "feat: initial schema with profiles, messages, summaries, brain_cache_meta"
```

---

## Task 3: Helper `scripts/lib/env.ts` (cargar .env.local)

**Files:**
- Create: `academia-lp/scripts/lib/env.ts`
- Create: `academia-lp/scripts/lib/tests/env.test.ts`

- [ ] **Step 1: Test que falla**

`academia-lp/scripts/lib/tests/env.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { loadEnv } from '../env'

describe('loadEnv', () => {
  it('returns required keys when present in process.env', () => {
    process.env.TEST_FOO = 'bar'
    const env = loadEnv(['TEST_FOO'] as const)
    expect(env.TEST_FOO).toBe('bar')
  })

  it('throws when a required key is missing', () => {
    delete process.env.MISSING_KEY
    expect(() => loadEnv(['MISSING_KEY'] as const)).toThrow(/MISSING_KEY/)
  })
})
```

- [ ] **Step 2: Verificar que falla**

```
npx vitest run scripts/lib/tests/env.test.ts
```
Expected: FAIL — `Cannot find module '../env'` o similar.

- [ ] **Step 3: Implementar**

`academia-lp/scripts/lib/env.ts`:

```typescript
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

let loaded = false

function loadDotEnvLocal(): void {
  if (loaded) return
  loaded = true
  const path = join(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

export function loadEnv<K extends string>(keys: readonly K[]): Record<K, string> {
  loadDotEnvLocal()
  const out = {} as Record<K, string>
  const missing: string[] = []
  for (const k of keys) {
    const v = process.env[k]
    if (!v) {
      missing.push(k)
    } else {
      out[k] = v
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars: ${missing.join(', ')}. ` +
        `Make sure they are set in .env.local or in your shell.`
    )
  }
  return out
}
```

- [ ] **Step 4: Verificar que pasa**

```
npx vitest run scripts/lib/tests/env.test.ts
```
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```
git add academia-lp/scripts/lib
git commit -m "feat: add loadEnv helper for admin scripts"
```

---

## Task 4: Helper `scripts/lib/code.ts` (generador de códigos)

**Files:**
- Create: `academia-lp/scripts/lib/code.ts`
- Create: `academia-lp/scripts/lib/tests/code.test.ts`

- [ ] **Step 1: Test que falla**

`academia-lp/scripts/lib/tests/code.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { generateCode } from '../code'

describe('generateCode', () => {
  it('returns a string with prefix NARDO- and 4 chars after', () => {
    const code = generateCode()
    expect(code).toMatch(/^NARDO-[A-Z0-9]{4}$/)
  })

  it('generates different codes on consecutive calls (smoke)', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 50; i++) codes.add(generateCode())
    // 50 generations: collisions must be < 5 with the alphabet/length we use.
    expect(codes.size).toBeGreaterThan(45)
  })

  it('uses an unambiguous alphabet (no 0/O/1/I)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode()
      expect(code).not.toMatch(/[0OI1]/)
    }
  })
})
```

- [ ] **Step 2: Verificar que falla**

```
npx vitest run scripts/lib/tests/code.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar**

`academia-lp/scripts/lib/code.ts`:

```typescript
import { randomInt } from 'node:crypto'

// Alfabeto legible: sin 0/O/1/I para evitar confusión cuando se dicta por teléfono o WhatsApp.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCode(): string {
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[randomInt(0, ALPHABET.length)]
  }
  return `NARDO-${suffix}`
}
```

- [ ] **Step 4: Verificar que pasa**

```
npx vitest run scripts/lib/tests/code.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```
git add academia-lp/scripts/lib/code.ts academia-lp/scripts/lib/tests/code.test.ts
git commit -m "feat: add code generator for student invites"
```

---

## Task 5: Helper `scripts/lib/admin-client.ts` (cliente Supabase con service_role)

**Files:**
- Create: `academia-lp/scripts/lib/admin-client.ts`

> Sin tests unitarios para este archivo: es un wrapper trivial sobre `createClient` y testarlo requeriría mockear el SDK entero, sin valor real. Las pruebas de integración llegan en los scripts (Task 6+).

- [ ] **Step 1: Crear el archivo**

`academia-lp/scripts/lib/admin-client.ts`:

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loadEnv } from './env'

let cached: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (cached) return cached

  const env = loadEnv([
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ] as const)

  cached = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return cached
}
```

- [ ] **Step 2: Commit**

```
git add academia-lp/scripts/lib/admin-client.ts
git commit -m "feat: add admin Supabase client for scripts"
```

---

## Task 6: Helper `scripts/lib/confirm.ts` (confirmación interactiva)

**Files:**
- Create: `academia-lp/scripts/lib/confirm.ts`

> Sin tests unitarios: usa `readline` (stdin) y mockearlo no aporta confianza real. Se prueba manualmente en Task 8 (delete-student) que es el primer script que lo usa.

- [ ] **Step 1: Crear el archivo**

`academia-lp/scripts/lib/confirm.ts`:

```typescript
import { createInterface } from 'node:readline'

/**
 * Asks the user a yes/no question. Returns true only if the answer is exactly "yes".
 * The strict "yes" requirement is intentional — these are destructive operations.
 */
export async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(`${question} (escribe "yes" para confirmar): `, resolve)
    })
    return answer.trim().toLowerCase() === 'yes'
  } finally {
    rl.close()
  }
}
```

- [ ] **Step 2: Commit**

```
git add academia-lp/scripts/lib/confirm.ts
git commit -m "feat: add interactive confirm helper for destructive scripts"
```

---

## Task 7: Script `create-student`

**Files:**
- Create: `academia-lp/scripts/create-student.ts`

- [ ] **Step 1: Crear el script**

`academia-lp/scripts/create-student.ts`:

```typescript
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
    email_confirm: true, // marcamos como confirmado: no necesita email de confirmación
  })

  if (error) {
    console.error('Error al crear el usuario:', error.message)
    process.exit(2)
  }
  if (!data.user) {
    console.error('Usuario no creado (sin error pero sin user devuelto).')
    process.exit(2)
  }

  // El profile lo crea el trigger on_auth_user_created (con must_change_password = true).

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
```

- [ ] **Step 2: Probar manualmente con un email de prueba**

```
npm run create-student -- prueba+1@test.local
```

Expected output:
```

  Alumna creada
  Email:  prueba+1@test.local
  Código: NARDO-XXXX

  Pasa estos datos a la profesora.
```

- [ ] **Step 3: Verificar en Supabase Studio**

Authentication → Users: debe aparecer `prueba+1@test.local`.
Table Editor → `profiles`: debe haber una fila para ese user_id con `must_change_password = true`.

- [ ] **Step 4: Commit**

```
git add academia-lp/scripts/create-student.ts
git commit -m "feat: add create-student script"
```

---

## Task 8: Script `delete-student`

**Files:**
- Create: `academia-lp/scripts/delete-student.ts`

- [ ] **Step 1: Crear el script**

`academia-lp/scripts/delete-student.ts`:

```typescript
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
  // listUsers no acepta filtro server-side por email todavía, lo filtramos en cliente.
  // Para volúmenes pequeños (< miles) está bien.
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

  // El cascade de las FK (on delete cascade en profiles, messages, etc.) hace el resto.
  console.log(`Alumna ${email} borrada.`)
}

main().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(99)
})
```

- [ ] **Step 2: Probar manualmente con la alumna de prueba**

```
npm run delete-student -- prueba+1@test.local
```

Cuando pida confirmación, escribe `yes` y enter.

Expected: `Alumna prueba+1@test.local borrada.`

- [ ] **Step 3: Verificar**

Supabase Studio → Authentication → Users: ya no aparece.
Table Editor → `profiles`: la fila también desapareció (cascade).

- [ ] **Step 4: Commit**

```
git add academia-lp/scripts/delete-student.ts
git commit -m "feat: add delete-student script"
```

---

## Task 9: Script `list-students`

**Files:**
- Create: `academia-lp/scripts/list-students.ts`

- [ ] **Step 1: Crear el script**

`academia-lp/scripts/list-students.ts`:

```typescript
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
```

- [ ] **Step 2: Probar manualmente**

Primero crea un par de alumnas:
```
npm run create-student -- prueba+a@test.local
npm run create-student -- prueba+b@test.local
```

Luego:
```
npm run list-students
```

Expected: lista de 2 alumnas con fecha, email y flag `[código provisional]`.

- [ ] **Step 3: Commit**

```
git add academia-lp/scripts/list-students.ts
git commit -m "feat: add list-students script"
```

---

## Task 10: Script `reset-student-password`

**Files:**
- Create: `academia-lp/scripts/reset-student-password.ts`

- [ ] **Step 1: Crear el script**

`academia-lp/scripts/reset-student-password.ts`:

```typescript
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
```

- [ ] **Step 2: Probar**

```
npm run reset-student-password -- prueba+a@test.local
```

Expected: imprime un nuevo `Código nuevo: NARDO-XXXX`.

- [ ] **Step 3: Verificar**

`npm run list-students` debe seguir mostrando a `prueba+a@test.local` con flag `[código provisional]`.

- [ ] **Step 4: Commit**

```
git add academia-lp/scripts/reset-student-password.ts
git commit -m "feat: add reset-student-password script"
```

---

## Task 11: Script `student-activity`

**Files:**
- Create: `academia-lp/scripts/student-activity.ts`

- [ ] **Step 1: Crear el script**

`academia-lp/scripts/student-activity.ts`:

```typescript
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
```

- [ ] **Step 2: Probar**

```
npm run student-activity -- prueba+a@test.local
```

Expected (sin mensajes todavía):
```
  prueba+a@test.local
  Mensajes totales: 0
  Mensajes con foto: 0
  Último mensaje: sin actividad
```

- [ ] **Step 3: Commit**

```
git add academia-lp/scripts/student-activity.ts
git commit -m "feat: add student-activity script"
```

---

## Task 12: Añadir componentes shadcn `input` y `label`

**Files:**
- Create (vía shadcn CLI): `academia-lp/components/ui/input.tsx`
- Create (vía shadcn CLI): `academia-lp/components/ui/label.tsx`

- [ ] **Step 1: Añadir los componentes**

Desde `academia-lp/`:
```
npx shadcn@latest add input label -y
```

- [ ] **Step 2: Verificar**

Los archivos `components/ui/input.tsx` y `components/ui/label.tsx` deben existir.

- [ ] **Step 3: Commit**

```
git add academia-lp/components academia-lp/package.json academia-lp/package-lock.json
git commit -m "chore: add shadcn input and label components"
```

---

## Task 13: Server actions de auth

**Files:**
- Create: `academia-lp/lib/auth/actions.ts`
- Create: `academia-lp/lib/auth/tests/actions.test.ts`

> **Nota Next.js 16:** los server actions siguen siendo el patrón `'use server'` en archivos del directorio `app/` o cualquier archivo importado por componentes server. Misma API que en v15. Verifica `node_modules/next/dist/docs/` si tienes dudas.

- [ ] **Step 1: Test que falla (validación de input)**

`academia-lp/lib/auth/tests/actions.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { validatePasswordStrength } from '../actions'

describe('validatePasswordStrength', () => {
  it('rejects passwords shorter than 8 chars', () => {
    expect(validatePasswordStrength('1234567')).toBe('La contraseña debe tener al menos 8 caracteres.')
  })

  it('rejects empty input', () => {
    expect(validatePasswordStrength('')).toBe('La contraseña no puede estar vacía.')
  })

  it('accepts valid password', () => {
    expect(validatePasswordStrength('contrasena12')).toBe(null)
  })
})
```

- [ ] **Step 2: Verificar que falla**

```
npx vitest run lib/auth/tests/actions.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar `lib/auth/actions.ts`**

`academia-lp/lib/auth/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = { ok: true } | { ok: false; error: string }

export function validatePasswordStrength(password: string): string | null {
  if (!password) return 'La contraseña no puede estar vacía.'
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  return null
}

export async function signInWithPassword(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { ok: false, error: 'Email y contraseña son obligatorios.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { ok: false, error: 'Email o contraseña incorrectos.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  const validation = validatePasswordStrength(password)
  if (validation) return { ok: false, error: validation }
  if (password !== confirm) return { ok: false, error: 'Las contraseñas no coinciden.' }

  const supabase = await createClient()

  const { data: userResult, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userResult.user) {
    return { ok: false, error: 'No has iniciado sesión.' }
  }

  const { error: updErr } = await supabase.auth.updateUser({ password })
  if (updErr) return { ok: false, error: updErr.message }

  const { error: profErr } = await supabase
    .from('profiles')
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq('user_id', userResult.user.id)

  if (profErr) return { ok: false, error: profErr.message }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { ok: false, error: 'Introduce tu email.' }

  const supabase = await createClient()
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirmar-reset`,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
```

- [ ] **Step 4: Verificar que pasa el test**

```
npx vitest run lib/auth/tests/actions.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Añadir `NEXT_PUBLIC_SITE_URL` a `.env.example` y `.env.local`**

Modifica `academia-lp/.env.example`, añadiendo al final:

```
# Public site URL (used by password reset emails)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Modifica `academia-lp/.env.local` añadiendo:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 6: Commit**

```
git add academia-lp/lib/auth academia-lp/.env.example
git commit -m "feat: add auth server actions (signIn, signOut, changePassword, requestReset)"
```

---

## Task 14: Helper `lib/auth/must-change-password.ts`

**Files:**
- Create: `academia-lp/lib/auth/must-change-password.ts`

- [ ] **Step 1: Crear el archivo**

`academia-lp/lib/auth/must-change-password.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'

/**
 * Returns true if the currently authenticated user has the must_change_password flag set.
 * Returns false if the user is not authenticated (caller should handle that case separately).
 */
export async function mustChangePassword(): Promise<boolean> {
  const supabase = await createClient()
  const { data: userResult, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userResult.user) return false

  const { data, error } = await supabase
    .from('profiles')
    .select('must_change_password')
    .eq('user_id', userResult.user.id)
    .single()

  if (error || !data) return false
  return data.must_change_password === true
}
```

- [ ] **Step 2: Commit**

```
git add academia-lp/lib/auth/must-change-password.ts
git commit -m "feat: add mustChangePassword helper"
```

---

## Task 15: Layout y página `/login`

**Files:**
- Create: `academia-lp/app/(auth)/layout.tsx`
- Create: `academia-lp/app/(auth)/login/page.tsx`
- Create: `academia-lp/components/auth/login-form.tsx`

- [ ] **Step 1: Layout para el route group `(auth)`**

`academia-lp/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">{children}</div>
    </main>
  )
}
```

- [ ] **Step 2: Página `/login`**

`academia-lp/app/(auth)/login/page.tsx`:

```tsx
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
```

- [ ] **Step 3: Componente `LoginForm`**

`academia-lp/components/auth/login-form.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithPassword } from '@/lib/auth/actions'

export function LoginForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await signInWithPassword(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.replace('/')
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña / código</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Verificar que compila**

```
npm run build
```
Expected: zero errors. Las nuevas rutas aparecen en el output.

- [ ] **Step 5: Commit**

```
git add academia-lp
git commit -m "feat: add login page with form and route group layout"
```

---

## Task 16: Página `/cambiar-contrasena`

**Files:**
- Create: `academia-lp/app/(auth)/cambiar-contrasena/page.tsx`
- Create: `academia-lp/components/auth/change-password-form.tsx`

- [ ] **Step 1: Página**

`academia-lp/app/(auth)/cambiar-contrasena/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChangePasswordForm } from '@/components/auth/change-password-form'

export default async function ChangePasswordPage() {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) redirect('/login')

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Cambia tu contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Antes de continuar, elige una contraseña nueva.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
```

- [ ] **Step 2: Componente**

`academia-lp/components/auth/change-password-form.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/lib/auth/actions'

export function ChangePasswordForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await changePassword(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.replace('/')
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Repítela</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar contraseña'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Verificar build**

```
npm run build
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```
git add academia-lp
git commit -m "feat: add forced change-password page"
```

---

## Task 17: Página `/recuperar` y handler `/auth/confirmar-reset`

**Files:**
- Create: `academia-lp/app/(auth)/recuperar/page.tsx`
- Create: `academia-lp/components/auth/recover-form.tsx`
- Create: `academia-lp/app/auth/confirmar-reset/route.ts`

- [ ] **Step 1: Página `/recuperar`**

`academia-lp/app/(auth)/recuperar/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Componente `RecoverForm`**

`academia-lp/components/auth/recover-form.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/lib/auth/actions'

export function RecoverForm() {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await requestPasswordReset(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDone(true)
    })
  }

  if (done) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Si el email existe, te ha llegado un enlace para restablecer la contraseña.
        Revisa tu bandeja (y la carpeta de spam).
      </p>
    )
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviarme el enlace'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Handler del callback de reset**

`academia-lp/app/auth/confirmar-reset/route.ts`:

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = '/cambiar-contrasena'

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Marcamos must_change_password = true para forzar el cambio (mismo flujo que primer login).
  const { data: userResult } = await supabase.auth.getUser()
  if (userResult.user) {
    await supabase
      .from('profiles')
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq('user_id', userResult.user.id)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
```

- [ ] **Step 4: Verificar build**

```
npm run build
```
Expected: zero errors.

- [ ] **Step 5: Commit**

```
git add academia-lp
git commit -m "feat: add password recovery page and email-link handler"
```

---

## Task 18: Layout protegido `(app)` y página privada placeholder

**Files:**
- Create: `academia-lp/app/(app)/layout.tsx`
- Create: `academia-lp/app/(app)/inicio/page.tsx`
- Modify: `academia-lp/app/page.tsx` (la home actual con el botón "Verificar conexiones") la convertimos en redirect basado en sesión.

> **Nota Next.js:** dos archivos `page.tsx` no pueden mapear a la misma ruta. Por eso el placeholder privado vive en `/inicio` (no en `/`), y `app/page.tsx` (raíz) se convierte en un redirect según haya sesión o no.

- [ ] **Step 1: Layout protegido del route group `(app)`**

Crea el directorio en PowerShell:
```powershell
New-Item -ItemType Directory -Force -Path "academia-lp\app\(app)"
```

Luego crea `academia-lp/app/(app)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mustChangePassword } from '@/lib/auth/must-change-password'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()

  if (!userResult.user) redirect('/login')
  if (await mustChangePassword()) redirect('/cambiar-contrasena')

  return <div className="min-h-screen">{children}</div>
}
```

- [ ] **Step 2: Página privada placeholder en `/inicio`**

Crea el directorio:
```powershell
New-Item -ItemType Directory -Force -Path "academia-lp\app\(app)\inicio"
```

Luego crea `academia-lp/app/(app)/inicio/page.tsx`:

```tsx
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function PrivateHome() {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  const email = userResult.user?.email ?? ''

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Academia LP</h1>
        <form action={signOut}>
          <Button type="submit" variant="outline">Cerrar sesión</Button>
        </form>
      </header>
      <section className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">Hola {email}</p>
        <p className="mt-2">
          El chat estará disponible al terminar la Fase 1B. De momento ya tienes acceso autenticado y la sesión está activa.
        </p>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Convertir `app/page.tsx` raíz en redirect inteligente**

Reemplaza el contenido de `academia-lp/app/page.tsx` por:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Index() {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (userResult.user) {
    redirect('/inicio')
  } else {
    redirect('/login')
  }
}
```

- [ ] **Step 4: Verificar build**

```
npm run build
```
Expected: zero errors. El árbol de rutas debe incluir `/`, `/login`, `/cambiar-contrasena`, `/recuperar`, `/inicio`, `/auth/confirmar-reset`, `/api/health`.

- [ ] **Step 5: Commit**

```
git add academia-lp
git commit -m "feat: protected (app) layout, private /inicio placeholder, smart root redirect"
```

---

## Task 19: Prueba end-to-end manual del flujo completo

> Esta tarea no produce código. Es la verificación de que toda la Fase 1A funciona en conjunto.

- [ ] **Step 1: Limpiar usuarios de prueba**

```
npm run delete-student -- prueba+a@test.local
npm run delete-student -- prueba+b@test.local
npm run delete-student -- prueba+1@test.local
```

(Algunos pueden no existir y dar "no se ha encontrado". Está bien.)

- [ ] **Step 2: Crear una alumna de prueba con email real**

Usa un email real al que tengas acceso (Gmail, Outlook, etc.). Ej:
```
npm run create-student -- tu-email-real@gmail.com
```

Anota el código que imprime.

- [ ] **Step 3: Probar login**

1. Arranca el dev server: `npm run dev`.
2. Abre `http://localhost:3000` — debes ser redirigida a `/login`.
3. Introduce el email + el código que anotaste. Pulsa "Entrar".
4. Debes ser redirigida automáticamente a `/cambiar-contrasena` (porque `must_change_password = true`).

- [ ] **Step 4: Probar cambio de contraseña**

1. Pon una contraseña nueva (mínimo 8 chars). Pulsa "Guardar contraseña".
2. Debes ser redirigida a `/inicio` y ver "Hola tu-email-real@gmail.com".
3. Cierra sesión con el botón.

- [ ] **Step 5: Probar segundo login con la nueva contraseña**

1. Vuelve a `/login`.
2. Introduce el email + la **nueva** contraseña.
3. Debes ir directamente a `/inicio` (sin pasar por `/cambiar-contrasena`).

- [ ] **Step 6: Probar reset por email**

1. Cierra sesión.
2. En `/login`, pulsa "¿Has olvidado tu contraseña?".
3. Introduce el email. Pulsa "Enviarme el enlace".
4. Revisa tu bandeja de entrada (y spam) en 1-2 minutos.
5. Pulsa el enlace del email. Debe llevarte a `/cambiar-contrasena`.
6. Pon una contraseña nueva diferente. Pulsa Guardar.
7. Debe ir a `/inicio`.

- [ ] **Step 7: Probar verificación de aislamiento (RLS funciona)**

1. Crea una segunda alumna: `npm run create-student -- otra+test@gmail.com`.
2. En el navegador estás logueada como la primera. Abre la consola del navegador (DevTools → Console) y escribe:

```javascript
fetch('/api/probe-other-user', { method: 'GET' }).then(r => r.text()).then(console.log)
```

> Nota: este endpoint de prueba no existe (devolverá 404), pero ese es el punto: aunque conocieras el ID de la otra alumna, el RLS impediría que pudieras ver sus datos a través del cliente normal. Como verificación más sólida puedes ir al SQL Editor de Supabase y ejecutar (pegándote como la primera alumna):

```sql
-- En SQL Editor: settings → "Run as authenticated user"
select * from messages;
```

Solo debe mostrar 0 filas (no tienes mensajes todavía) y NUNCA debe mostrar filas de otras usuarias.

- [ ] **Step 8: Limpiar**

```
npm run delete-student -- tu-email-real@gmail.com
npm run delete-student -- otra+test@gmail.com
```

- [ ] **Step 9: Confirmar fase completada**

Si todos los pasos anteriores funcionan, la Fase 1A está terminada. Lista de funciones que ya tienes:

- ✅ Migraciones aplicadas
- ✅ 5 scripts admin funcionando
- ✅ Login con email + código
- ✅ Cambio de contraseña forzado en primer login
- ✅ Reset de contraseña por email
- ✅ Layout protegido para zona privada
- ✅ Aislamiento de datos por RLS

Pasamos al plan de **Fase 1B — Chat con el Cerebro**.

- [ ] **Step 10: Commit final de la fase (si quedó algún archivo sin committear)**

```
git status
git add -A academia-lp
git commit -m "chore: phase 1A complete"   # solo si hay algo que commitear
git push
```
