# 03 — Plan de desarrollo por fases

## Resumen

| Fase | Qué se construye | Duración aprox |
|---|---|---|
| **0 — Cimientos** | Repo Next.js, Supabase, Vercel, claves Gemini, "hola mundo" desplegado | 1-2 días |
| **1 — MVP texto** | Login con código, cambio de contraseña forzado, chat con Cerebro completo | 4-6 días |
| **2 — Foto** | Subida cámara/galería, evaluación estructurada + chat libre | 2-3 días |
| **3 — Pulido** | PWA instalable, paleta de la profesora, manejo de errores, accesibilidad | 2-3 días |
| **4 — Apps nativas** *(más adelante)* | Empaquetado con Capacitor → APK + IPA | 2-3 días extra |

**Total para tener algo listo para alumnas reales: ~10-15 días de trabajo.**

## Detalle de cada fase

### Fase 0 — Cimientos

Objetivo: tener la infraestructura básica funcionando con un "Hola mundo" desplegado.

- Crear repositorio (Git).
- Inicializar proyecto Next.js 16 con App Router, TypeScript, Tailwind.
- Crear proyecto en Supabase (free tier).
- Crear proyecto en Vercel y conectarlo al repo.
- Configurar variables de entorno (claves Supabase, Vercel AI Gateway).
- Crear cuenta y obtener acceso a Vercel AI Gateway.
- Instalar shadcn/ui con tema base.
- Push inicial → ver "Hola mundo" en una URL `*.vercel.app`.

**Entregable:** URL pública con la app vacía desplegada.

### Fase 1 — MVP texto

Objetivo: una alumna puede iniciar sesión y mantener una conversación de texto con el bot, que responde basándose en el Cerebro.

- Aplicar migraciones de Supabase: tablas `profiles`, `messages`, `conversation_summaries`, `brain_cache_meta`.
- Activar RLS y aplicar políticas.
- Pantalla de login (email + código).
- Pantalla de cambio de contraseña forzado (cuando `must_change_password = true`).
- Pantalla principal de chat (estilo WhatsApp, una sola conversación).
- Endpoint `/api/chat` con streaming desde Gemini vía Vercel AI Gateway.
- Script `scripts/create-student.ts` para dar de alta alumnas.
- Script `scripts/rebuild-brain.ts` para procesar el Cerebro y crear el context cache.
- Lógica de resumen automático del historial antiguo.
- System prompt inicial con tono de la profesora (extraído de transcripciones).
- Reset de contraseña por email (Supabase de serie).

**Entregable:** una alumna real puede iniciar sesión y chatear con el bot sobre cualquier tema del curso.

### Fase 2 — Análisis de fotos

Objetivo: la alumna puede subir fotos y recibir evaluación estructurada.

- Bucket `fotos-alumnas` en Supabase Storage con políticas.
- UI: botón de cámara/adjuntar en el chat (input file con `accept="image/*"` y `capture="environment"` para móvil).
- Subida directa cliente → Supabase Storage con URL firmada.
- Endpoint `/api/chat` extendido para aceptar imágenes (Gemini soporta vision nativo).
- System prompt extendido con plantilla de evaluación estructurada.

**Entregable:** la alumna sube una foto y recibe una evaluación tipo informe + puede seguir preguntando libremente.

### Fase 3 — Pulido y branding

Objetivo: la app se ve profesional, con la imagen de la profesora, y se puede instalar en móviles como PWA.

- Configurar `manifest.json` y service worker para PWA instalable.
- Iconos y splash screens (a partir del logo de la profesora).
- Aplicar paleta de colores y tipografía de la profesora.
- Estados de carga, error, vacío bonitos.
- Mensajes de error claros.
- Accesibilidad: contraste, navegación por teclado, ARIA labels.
- Optimización de imágenes (compresión antes de subir).

**Entregable:** app pulida, instalable como PWA en iOS y Android desde el navegador.

### Fase 4 — Apps nativas (más adelante)

Objetivo: tener la app en App Store y Play Store.

- Integrar Capacitor en el proyecto Next.js.
- Configurar plugins nativos (cámara con mejor UX, notificaciones push si se quieren).
- Build de Android (APK).
- Build de iOS (requiere cuenta Apple Developer, $99/año).
- Subida a las stores (proceso de revisión: ~1-7 días para Android, hasta 2 semanas para iOS).

**Entregable:** apps nativas en las stores con la misma codebase que la webapp.

## Cómo decidir cuándo pasar de fase

Cada fase es estable por sí sola. No empieces la siguiente hasta que la actual:

- Funciona end-to-end con datos reales (no solo con mocks).
- Pasa una prueba manual completa del flujo principal.
- Está desplegada en Vercel y la URL es accesible.

Si encuentras bugs en una fase posterior que afectan a una anterior, prioriza arreglarlos antes de seguir avanzando.
