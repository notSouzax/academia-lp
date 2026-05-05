# Academia LP

Asistente de IA sobre micropigmentación de cejas (nanoblading) basado en el método de la profesora.

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS + shadcn/ui
- Supabase (Auth, DB, Storage)
- Gemini 2.5 Flash vía `@ai-sdk/google` con clave directa de Google AI Studio
- Desplegado en Vercel

## Arrancar localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Crea `.env.local` con (ver `.env.example` para la plantilla):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Si tienes acceso al proyecto en Vercel: `vercel env pull .env.local`.

## Verificación rápida

`GET /api/health` devuelve el estado de Supabase y Gemini. La página principal tiene un botón que lo invoca.

## Documentación

Toda la documentación (decisiones de diseño, planes de implementación por fase, operativa diaria, FAQ) vive en `MANUAL/` un nivel arriba del repo.
