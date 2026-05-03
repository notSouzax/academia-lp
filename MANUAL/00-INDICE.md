# MANUAL — Academia LP

Asistente de IA sobre micropigmentación de cejas (nanoblading) basado en el método de la profesora.

Toda la información que tienes que saber sobre el proyecto está organizada en estos documentos. Léelos en orden la primera vez; después úsalos como referencia.

## Índice

1. [01 — Visión y decisiones tomadas](01-VISION-Y-DECISIONES.md) — Qué es la app, para quién, alcance del MVP, decisiones acordadas.
2. [02 — Arquitectura técnica](02-ARQUITECTURA.md) — Stack, modelo de datos, flujos clave, cómo se conecta el Cerebro.
3. [03 — Plan de desarrollo por fases](03-PLAN-DE-DESARROLLO.md) — Hitos, duración, qué se entrega en cada fase.
4. [04 — Operativa diaria](04-OPERATIVA-DIARIA.md) — Cómo dar de alta alumnas, actualizar el Cerebro, gestionar contraseñas.
5. [05 — Seguridad y aislamiento de datos](05-SEGURIDAD.md) — Cómo evitamos fugas de datos. Qué hacer ante incidentes.
6. [06 — Costes estimados](06-COSTES.md) — Cuánto va a costar Gemini, Supabase y Vercel.
7. [07 — Branding pendiente](07-BRANDING.md) — Lo que hace falta de la profesora para diseñar el visual.
8. [08 — Preguntas frecuentes](08-FAQ.md) — Qué hacer si X, situaciones operativas comunes.

## Estado del proyecto

- **Fecha de diseño:** 2026-05-03
- **Fase actual:** diseño aprobado, pendiente de empezar implementación
- **Stack acordado:** Next.js 16 + Supabase + Vercel + Gemini 2.5 Flash vía Vercel AI Gateway
- **Camino a app nativa:** Capacitor (en fase 4, después del MVP)

## Glosario rápido

- **Cerebro:** carpeta con los documentos del curso de la profesora (libro + transcripciones). Es la base de conocimiento del bot.
- **Context cache:** mecanismo de Gemini que cachea documentos largos para reutilizarlos a precio reducido en cada conversación.
- **PWA:** webapp instalable como app desde el navegador en móvil y escritorio.
- **RLS (Row Level Security):** mecanismo de Supabase que asegura a nivel de base de datos que cada usuaria solo accede a sus propios datos.
- **Capacitor:** herramienta que envuelve una webapp como app nativa para iOS y Android.
