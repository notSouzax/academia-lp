# 04 — Operativa diaria

Esta es tu chuleta de comandos para el día a día. Todos los scripts viven en `scripts/` del repo y se ejecutan con `npm run`.

## Dar de alta una alumna nueva

**Cuándo:** la profesora te manda un email diciendo "esta es nueva alumna".

**Cómo:**

```bash
npm run create-student -- nueva.alumna@email.com
```

El script:

1. Genera un código aleatorio de 8 caracteres (ej. `NARDO-X7K2`).
2. Crea el usuario en Supabase Auth con ese código como contraseña.
3. Crea su `profile` con `must_change_password = true`.
4. Imprime en consola algo así:

```
✓ Alumna creada
  Email:  nueva.alumna@email.com
  Código: NARDO-X7K2
```

**Qué le pasas a la profesora:** el email y el código. Ella se lo da a la alumna.

## Dar de baja una alumna

```bash
npm run delete-student -- alumna@email.com
```

El script borra el usuario, sus mensajes, su resumen y sus fotos. **No se puede deshacer.** Pide confirmación antes de ejecutar.

## Listar todas las alumnas activas

```bash
npm run list-students
```

Muestra una tabla con email, nombre, fecha de alta y si todavía tiene la contraseña provisional.

## Actualizar el Cerebro (añadir/quitar documentos del curso)

**Cuándo:** la profesora te pasa un documento nuevo (PDF, docx) o quiere quitar uno viejo.

**Cómo:**

1. Coloca el archivo nuevo en `Cerebro/` (o `Cerebro/transcripciones_curso_cejas/` si es una transcripción).
2. Si quieres quitar uno, simplemente bórralo de esa carpeta.
3. Ejecuta:

```bash
npm run rebuild-brain
```

El script:

1. Detecta cambios en los archivos.
2. Extrae texto de todos los archivos del Cerebro.
3. Sube el contenido a Gemini como un nuevo context cache.
4. Actualiza la fila `brain_cache_meta` en Supabase con el nuevo `cache_id`.
5. La siguiente conversación que cualquier alumna inicie usará el cache nuevo.

**Tiempo de ejecución estimado:** 30-90 segundos según el tamaño del Cerebro.

## Forzar reseteo de contraseña de una alumna

**Cuándo:** una alumna ha olvidado su contraseña y por algún motivo el reset por email no le funciona.

**Cómo:**

```bash
npm run reset-student-password -- alumna@email.com
```

El script:

1. Genera un nuevo código aleatorio.
2. Lo establece como contraseña.
3. Marca `must_change_password = true` para que la alumna lo cambie en el siguiente login.
4. Imprime el código nuevo. Tú se lo pasas a la profesora.

## Ver actividad de una alumna (diagnóstico)

```bash
npm run student-activity -- alumna@email.com
```

Muestra: número de mensajes, fecha del último mensaje, número de fotos subidas. Útil si algo no va bien.

## Desplegar cambios

Hacer `git push` a la rama `main`. Vercel detecta el push y despliega automáticamente. La nueva versión está en producción en ~1-2 minutos.

## Variables de entorno (resumen)

Configuradas en Vercel (Settings → Environment Variables) y en `.env.local` para desarrollo local:

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) — se puede exponer al cliente. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave admin — **NUNCA al cliente**. Solo para scripts y endpoints de servidor. |
| `AI_GATEWAY_API_KEY` | Clave de Vercel AI Gateway para llamar a Gemini en el chat (si la Gateway soporta cache referenciado). |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Clave directa de Google AI. Necesaria para crear y gestionar el context cache. Posiblemente también para el chat si la Gateway no soporta cache (a confirmar en fase 0). |

**Antes de empezar la fase 0 necesitarás también la Vercel CLI instalada:**

```bash
npm i -g vercel
vercel login
```

Te lo recordaré cuando arranquemos.

Para sincronizar variables de Vercel a tu máquina:

```bash
vercel env pull .env.local
```

## Backups

Supabase hace backups automáticos diarios en el plan free (retención 7 días). Para el plan paid, retención hasta 30 días. **No hace falta hacer nada manual.**

Si quieres un backup puntual antes de un cambio importante:

```bash
npm run backup-db
```

Genera un dump SQL en `backups/YYYY-MM-DD-HHMM.sql`.
