# 02 — Arquitectura técnica

## Visión general

```
[Alumna en móvil/desktop]
        │
        │ HTTPS
        ▼
[Next.js App en Vercel]              (frontend + API routes)
        │
        ├─► [Supabase Auth]          login email/password
        ├─► [Supabase DB]            usuarias, mensajes, resúmenes
        ├─► [Supabase Storage]       fotos subidas por alumnas (bucket privado)
        │
        └─► [Vercel AI Gateway]
                │
                ▼
            [Gemini 2.5 Flash]       con context cache del Cerebro
```

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | Next.js 16 (App Router) | Webapp moderna, fácil de empaquetar como PWA y luego envolver con Capacitor. |
| Hosting | Vercel | Despliegue automático desde Git, integración nativa con Next.js, free tier amplio. |
| Base de datos | Supabase (Postgres) | Auth + DB + Storage en un solo servicio. RLS para aislamiento. |
| Auth | Supabase Auth | Email/contraseña, reset por email automático, sesiones seguras. |
| Storage | Supabase Storage | Bucket privado con políticas por usuaria para las fotos. |
| AI (chat normal) | Gemini 2.5 Flash vía Vercel AI Gateway | Acceso vía string `"google/gemini-2.5-flash"` con AI SDK. Permite cambiar de modelo sin reescribir código. |
| AI (gestión del cache) | SDK oficial `@google/genai` con clave directa | Context Caching es una API de Google AI que no se gestiona desde la AI Gateway todavía: crear/refrescar el cache se hace directamente contra Google. Las llamadas de chat pueden seguir pasando por la Gateway referenciando el `cache_id`. |
| UI | Tailwind CSS + shadcn/ui | Componentes accesibles y rápidos de personalizar con la paleta de la profesora. |
| Empaquetado nativo (fase 4) | Capacitor | Envuelve la webapp como APK e IPA sin reescribir lógica. |

> **Nota técnica importante:** durante la fase 0 verificaremos si la Vercel AI Gateway puede consumir un context cache existente. Si no, la decisión limpia es usar el SDK oficial de Google (`@google/genai`) directamente para todo lo relacionado con el chat. Esto solo afecta a la implementación; el resto del diseño no cambia.

## Modelo de datos (Supabase / Postgres)

### Tablas

**`auth.users`** (gestionada por Supabase Auth automáticamente)
- `id` (UUID) — clave primaria.
- `email` — único.
- `encrypted_password` — contraseña hasheada por Supabase.
- `created_at`.

**`profiles`** (1:1 con `auth.users`)
- `user_id` (UUID, FK a `auth.users.id`) — clave primaria.
- `display_name` (TEXT) — nombre que ve la alumna.
- `must_change_password` (BOOL, default `true`) — fuerza cambio de contraseña en primer login.
- `created_at`, `updated_at`.

**`messages`** (historial de chat)
- `id` (UUID) — clave primaria.
- `user_id` (UUID, FK) — dueña del mensaje.
- `role` (ENUM: `user` | `assistant`).
- `content` (TEXT).
- `image_url` (TEXT, nullable) — si el mensaje incluye foto.
- `created_at`.

**`conversation_summaries`** (resúmenes para mantener calidad/precio)
- `user_id` (UUID, FK) — clave primaria.
- `summary` (TEXT) — resumen del historial antiguo.
- `last_summarized_message_id` (UUID) — hasta qué mensaje hemos resumido.
- `updated_at`.

**`brain_cache_meta`** (una sola fila global)
- `id` (INT, siempre 1) — singleton.
- `cache_id` (TEXT) — id del context cache de Gemini.
- `cache_expires_at` (TIMESTAMP).
- `brain_hash` (TEXT) — hash de los archivos del Cerebro para detectar cambios.
- `updated_at`.

### Storage

- **Bucket `fotos-alumnas`** (privado).
- Estructura de paths: `/{user_id}/{uuid}.jpg`.
- Políticas: solo la dueña (`auth.uid() = user_id` extraído del path) puede leer/escribir/borrar.

### Row Level Security (RLS)

Activado en **todas** las tablas de datos de usuaria. Política base:

```sql
-- Solo el dueño puede leer/escribir sus propias filas.
CREATE POLICY "Own data only"
  ON {tabla}
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Detalle ampliado en [05-SEGURIDAD.md](05-SEGURIDAD.md).

## Flujos clave

### Flujo A: Alta de una alumna nueva (lo haces tú)

1. La profesora te pasa el email de la nueva alumna.
2. Ejecutas `npm run create-student -- alumna@email.com`.
3. El script:
   - Genera un código aleatorio (ej. `NARDO-X7K2`).
   - Crea el usuario en Supabase Auth con ese código como contraseña.
   - Crea la fila en `profiles` con `must_change_password = true`.
   - Imprime en consola: `Email: alumna@email.com  Código: NARDO-X7K2`.
4. Pasas ese código a la profesora para que se lo dé a la alumna.

### Flujo B: Primer login de la alumna

1. Alumna abre la webapp (o PWA), introduce email + código.
2. La app detecta `must_change_password = true` → la lleva a `/cambiar-contraseña`.
3. La alumna pone su nueva contraseña (mínimo 8 caracteres).
4. App actualiza la contraseña, marca `must_change_password = false`, redirige al chat.

### Flujo C: Conversación normal (texto)

1. Alumna escribe un mensaje en el chat.
2. La API route `/api/chat` valida la sesión y carga el contexto:
   - System prompt (tono profesora + reglas de evaluación).
   - `cache_id` actual del Cerebro desde `brain_cache_meta`.
   - Resumen del historial antiguo desde `conversation_summaries`.
   - Últimos ~15 mensajes desde `messages`.
3. Llama a Gemini 2.5 Flash con streaming. La respuesta aparece palabra a palabra.
4. Guarda el mensaje del usuario y la respuesta del asistente en `messages`.
5. Si la conversación supera ~20 mensajes nuevos desde el último resumen, lanza en background un job que actualiza `conversation_summaries`.

### Flujo D: Subida y análisis de foto

1. La alumna pulsa el botón de cámara/adjuntar (acepta cámara o galería en móvil).
2. La app sube la foto a Supabase Storage en `fotos-alumnas/{user_id}/{uuid}.jpg`.
3. Genera URL firmada temporal (1h) y la añade al mensaje.
4. Llama al chat con instrucción especial al modelo:
   - Estructura inicial fija de evaluación: simetría, profundidad, dirección del pelo, color, puntos a corregir.
   - Después permite preguntas libres ("¿cómo arreglo la simetría?").
5. Gemini ve la imagen + el Cerebro + el system prompt y devuelve evaluación.
6. La foto y el mensaje se guardan; queda en el historial de la alumna.

### Flujo E: Actualizar el Cerebro

1. La profesora te manda los nuevos PDFs/docx.
2. Los añades a `Cerebro/` en el repo.
3. Ejecutas `npm run rebuild-brain`. El script:
   - Extrae texto de todos los archivos.
   - Crea un nuevo context cache en Gemini.
   - Actualiza la fila `brain_cache_meta` con el nuevo `cache_id`.
4. A partir de la siguiente conversación, todas las alumnas usan el cache nuevo automáticamente.

## Cómo se construye el contexto enviado a Gemini

En cada mensaje al modelo se manda:

```
┌──────────────────────────────────────────────────────────┐
│ [ Cerebro completo ] ← context cache (~100k tokens)      │
│   Se paga una vez al crear el cache, luego ~25% del      │
│   precio normal de input al usarlo.                      │
├──────────────────────────────────────────────────────────┤
│ [ System prompt ] ← tono profesora + reglas evaluación   │
├──────────────────────────────────────────────────────────┤
│ [ Resumen del historial antiguo ] ← de summaries         │
├──────────────────────────────────────────────────────────┤
│ [ Últimos 15-20 mensajes en bruto ] ← de messages        │
├──────────────────────────────────────────────────────────┤
│ [ Mensaje nuevo de la alumna (con foto si la hay) ]      │
└──────────────────────────────────────────────────────────┘
```

Esto da buen balance entre coste y calidad: la alumna nunca pierde el hilo, y no pagamos por re-enviar mensajes muy antiguos en bruto.
