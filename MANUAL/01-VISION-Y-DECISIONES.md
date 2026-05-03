# 01 — Visión y decisiones tomadas

## Qué es Academia LP

Una webapp (con camino a apps nativas) donde las alumnas de la profesora pueden chatear con un asistente de IA experto en micropigmentación de cejas (nanoblading), específicamente entrenado con el método de la profesora.

El asistente:

- Responde dudas teóricas y prácticas sobre nanoblading.
- Acepta fotos del trabajo de la alumna (en piel sintética o real) y devuelve un análisis estructurado con consejos y correcciones.
- Mantiene el tono y la forma de hablar de la profesora (extraído de las transcripciones del curso).
- Solo habla sobre lo que sabe del método de la profesora; redirige preguntas fuera de tema.

## Para quién

Alumnas que ya han comprado el curso de la profesora aparte. La app es un complemento al curso, no un reemplazo. La profesora controla quién entra: ella te pasa los emails y tú das de alta a las alumnas manualmente.

## Decisiones tomadas durante el brainstorming (2026-05-03)

### Alcance del MVP
- **Decidido:** login simple para alumnas registradas manualmente, sin pagos integrados.
- **Razón:** las alumnas ya pagaron el curso aparte. La app se ofrece como complemento. Esto reduce mucho la complejidad inicial.

### Análisis de fotos
- **Decidido:** evaluación estructurada por defecto + chat libre después.
- **Razón:** garantiza rigor (la profesora confía en que siempre se revisan los mismos aspectos clave) sin perder la conversación natural.
- **Tono:** debe imitar la forma de hablar de la profesora, basándose en las transcripciones del curso.

### Historial de chat
- **Decidido:** una sola conversación continua por alumna (estilo WhatsApp).
- **Razón:** lo más natural para la alumna y lo más simple de construir.
- **Optimización de coste:** los últimos 15-20 mensajes se envían a Gemini en bruto; los más antiguos se resumen automáticamente.

### Gestión de alumnas y Cerebro
- **Decidido:** sin panel admin. Lo gestionas tú con scripts.
- **Razón:** mucho más rápido para el MVP. Si en el futuro hace falta autonomía para la profesora, se añade un panel.

### Stack técnico
- **Decidido:** Next.js (PWA) → Capacitor más adelante para apps nativas.
- **Razón:** webapp lista en días, no semanas. Cuando se necesiten apps en App Store y Play Store, Capacitor las empaqueta sin reescribir código.

### Cómo conectar el Cerebro al chatbot
- **Decidido:** Context Caching de Gemini con todo el Cerebro cargado.
- **Razón:** Gemini 2.5 Flash tiene 1M tokens de contexto; el Cerebro entero (~80-130k tokens estimados) cabe sin problema. Más simple que RAG, mejor calidad de respuestas, y más barato a este volumen gracias al cache.

### Login y contraseñas
- **Decidido:** sistema de códigos de invitación.
  1. La profesora pasa los emails de las nuevas alumnas.
  2. Tú generas una cuenta con un código aleatorio (ej. `NARDO-X7K2`) como contraseña inicial.
  3. La alumna entra con su email + código y la app la fuerza a cambiar la contraseña.
- **Reset de contraseña:** automático por email (Supabase lo trae de serie).

### Aislamiento de datos
- **Decidido:** Row Level Security (RLS) en Supabase + storage policies + sesiones seguras.
- **Razón:** evitar al 200% fuga de datos entre alumnas.

### Nombre de la app
- **Decidido:** "Academia LP".
- **Pendiente:** branding visual (paleta, logo, tipografía) basado en la imagen online de la profesora — ver [07-BRANDING.md](07-BRANDING.md).

## Lo que NO está incluido en el MVP

Para mantener el alcance manejable, conscientemente dejamos fuera:

- **Pagos / suscripciones.** Se añadirán en una fase posterior si se necesita.
- **Panel admin para la profesora.** Se gestiona con scripts.
- **Múltiples conversaciones por temas** (estilo ChatGPT con sidebar). Una sola conversación continua.
- **Apps nativas en stores.** Llegan en la fase 4 con Capacitor.
- **Generación de informes PDF, exportación de chats, etc.** No son críticos para el MVP.

Si en algún momento crees que algo de esto se vuelve crítico, lo añadimos como fase nueva.
