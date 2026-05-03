# 05 — Seguridad y aislamiento de datos

Tu requisito fue claro: "evitar al 200% fuga de datos entre alumnas". Este documento explica cómo lo conseguimos y qué hacer si algo va mal.

## Las 4 capas de protección

### Capa 1 — Row Level Security (RLS) en Supabase

Es la capa más importante. Se aplica a nivel de base de datos: aunque el código del servidor tuviera un bug, **Postgres rechaza la consulta** si la usuaria intenta acceder a datos que no son suyos.

Política aplicada a todas las tablas con datos de usuaria (`profiles`, `messages`, `conversation_summaries`):

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own data only"
  ON messages
  FOR ALL                        -- SELECT, INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id)   -- Lectura: solo si soy el dueño
  WITH CHECK (auth.uid() = user_id); -- Escritura: solo si me asigno como dueño
```

`auth.uid()` es una función de Supabase que devuelve el ID del usuario autenticado en la sesión actual. Si no hay sesión válida, devuelve `null` y la consulta no encuentra nada.

### Capa 2 — Storage policies

El bucket `fotos-alumnas` es **privado**. Solo se accede a través de URLs firmadas temporales o con la clave de la sesión. Política sobre el bucket:

```sql
CREATE POLICY "Solo el dueño puede leer/escribir sus fotos"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'fotos-alumnas'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

El path de cada foto es `{user_id}/{uuid}.jpg`. La policy comprueba que el primer segmento del path coincide con el id del usuario autenticado.

### Capa 3 — Cookies seguras y sesiones SSR

Usamos el helper `@supabase/ssr` para Next.js. Las sesiones se guardan en cookies con flags:

- `httpOnly` — no accesibles desde JavaScript del navegador (mitiga XSS).
- `secure` — solo se envían sobre HTTPS.
- `sameSite=lax` — mitiga CSRF.

**No guardamos tokens en localStorage.** Si alguien hace XSS no puede robar la sesión.

### Capa 4 — Validación en API routes

Cada endpoint de Next.js que toca datos:

1. Lee la cookie de sesión.
2. Valida que la sesión existe y no ha caducado.
3. Si no, devuelve `401 Unauthorized`.

La clave **service role** (que sí puede saltarse RLS) **NUNCA** se expone al cliente. Solo se usa en:

- Scripts de administración locales (`create-student`, `delete-student`, etc.).
- Endpoints de servidor muy específicos (ej. crear el context cache de Gemini con privilegios elevados).

Esos endpoints siempre validan primero que el llamante tiene autorización.

## Buenas prácticas obligatorias en el código

1. **Nunca hagas queries con `user_id` proveniente del cliente.** Siempre usa `auth.uid()` desde la sesión del servidor. Si el cliente manda un `user_id` en el body, ignóralo.
2. **Nunca uses la service role key fuera de scripts admin.** Si alguien encuentra esta clave por error en código del cliente, se acaba el aislamiento.
3. **Logs sin datos personales.** Cuando algo falle, registra el error pero no el contenido de mensajes ni emails completos. Trunca o anonimiza.
4. **HTTPS siempre.** Vercel lo da de serie. No deshabilitar.
5. **Revisar las políticas RLS antes de crear tablas nuevas.** Cada tabla con datos de usuaria debe tener RLS activado y políticas restrictivas desde el día 1.

## Qué hacer ante un incidente

### "Una alumna dice que ve datos de otra"

1. **Confirma el incidente:** pide capturas de pantalla.
2. **Aísla:** desactiva temporalmente el endpoint afectado en Vercel.
3. **Revisa políticas RLS** en la tabla involucrada.
4. **Revisa el código** del endpoint: ¿usa `auth.uid()` o acepta `user_id` del cliente?
5. **Notifica** a la profesora que hay un incidente y estás investigando.
6. **Arregla** y verifica con un test.
7. **Comunica** lo sucedido a las alumnas afectadas si efectivamente hubo fuga (RGPD lo exige en casos serios).

### "Sospecho que han accedido a la cuenta de una alumna sin permiso"

1. **Cambia la contraseña de la alumna inmediatamente:**
   ```bash
   npm run reset-student-password -- alumna@email.com
   ```
2. **Invalida todas sus sesiones activas** (Supabase tiene un endpoint admin para esto).
3. **Revisa logs** de Supabase Auth: hora de login, IP.
4. **Notifica** a la alumna.

### "Se ha filtrado una clave de API por error"

1. **Rota la clave inmediatamente** en el panel correspondiente (Supabase, Vercel, Google).
2. **Actualiza la variable de entorno** en Vercel.
3. **Si fue commitada al Git, reescribe el historial** o considera todo el repo comprometido.
4. **Revisa los logs** de uso de la clave en busca de actividad anómala.

## Checklist de seguridad antes de cada release

- [ ] RLS activado en todas las tablas de datos de usuaria.
- [ ] Storage bucket privado con políticas por path.
- [ ] Service role key solo en variables de entorno del servidor.
- [ ] Endpoints de API validan sesión antes de tocar datos.
- [ ] Cookies con `httpOnly`, `secure`, `sameSite`.
- [ ] HTTPS forzado en Vercel.
- [ ] No se loggean contenidos sensibles.
- [ ] Funciona el reset de contraseña por email.

## Cumplimiento RGPD (resumen práctico)

Como la app gestiona datos personales (emails) y posibles imágenes biométricas (fotos de cejas), aplica el RGPD:

- **Política de privacidad** clara en la app (qué datos se recogen, para qué, cuánto tiempo).
- **Derecho de acceso:** una alumna puede pedir todos sus datos. Lo resolvemos con un script `npm run export-student-data -- email`.
- **Derecho de borrado:** una alumna puede pedir eliminar su cuenta. Lo resolvemos con `npm run delete-student`.
- **Encriptación en reposo:** Supabase la trae de serie.
- **Encriptación en tránsito:** HTTPS, lo trae Vercel.
- **No usar los datos para entrenar modelos.** El system prompt y los logs no se usan para fine-tuning. Gemini, vía Vercel AI Gateway, no entrena con tus datos por defecto.

Cuando lleguemos a la fase 3, añadiremos en la app las pantallas de política de privacidad y términos de uso.
