# 08 — Preguntas frecuentes operativas

Situaciones comunes y cómo resolverlas.

---

### Una alumna no puede iniciar sesión

**Posibles causas:**

1. **Email mal escrito** → confirma el email exacto que le diste de alta. Compara con `npm run list-students`.
2. **Código provisional caducado o cambiado** → genera uno nuevo: `npm run reset-student-password -- email@…`.
3. **No se cambió la contraseña tras el primer login** → la contraseña sigue siendo el código original. Reintenta con el código.
4. **Cuenta no creada** → `npm run create-student -- email@…`.

---

### Una alumna olvidó su contraseña

**Camino normal:**

1. En la pantalla de login hay un enlace "¿Olvidaste tu contraseña?".
2. La alumna pulsa, mete su email, recibe correo con enlace de reset.
3. Cambia su contraseña.

**Si no le llega el email:**

- Revisar carpeta de spam.
- Confirmar que el email registrado coincide con el que está usando.
- **Plan B:** generas un nuevo código provisional con `npm run reset-student-password -- email@…` y se lo pasas a la profesora.

---

### La profesora me ha pasado un documento nuevo del curso

1. Guárdalo en `Cerebro/` (libros completos) o en `Cerebro/transcripciones_curso_cejas/` (transcripciones).
2. `npm run rebuild-brain`.
3. Listo. La siguiente conversación de cualquier alumna lo verá.

---

### El bot está dando respuestas raras o fuera de tema

**Diagnóstico:**

1. Revisa el system prompt en `lib/system-prompt.ts`. ¿Está alineado con el método de la profesora?
2. Revisa los mensajes de la alumna. Si hace preguntas ambiguas, el bot puede no entender bien.
3. Si el problema se repite con varias alumnas, considera ajustar el system prompt o añadir ejemplos de respuestas correctas.
4. Si el problema es el modelo en sí, prueba cambiar la temperatura (más baja = más conservador) o el modelo.

---

### El bot no reconoce algo que está en el Cerebro

**Posibles causas:**

1. **El context cache no está actualizado** → ejecuta `npm run rebuild-brain` y comprueba `brain_cache_meta`.
2. **El documento se procesó mal** → revisa los logs del último `rebuild-brain`. Quizá un PDF era una imagen escaneada y no se extrajo texto.
3. **La pregunta usa términos muy distintos a los del Cerebro** → puede ser limitación del modelo. Sugerencia: añadir un glosario al system prompt.

---

### Quiero ver qué le dice el bot a las alumnas

Por aislamiento de datos (RLS), tú no puedes leer mensajes de alumnas como si fueras ellas. Para diagnóstico:

```bash
npm run student-activity -- alumna@email.com
```

Te da estadísticas (sin contenido). Si necesitas ver contenido para depurar un caso concreto, hay un script con privilegios admin que pide confirmación explícita y deja log de la operación:

```bash
npm run admin-read-conversation -- alumna@email.com --reason "depuración bug X"
```

Úsalo solo cuando sea estrictamente necesario y con autorización de la alumna o la profesora.

---

### Vercel está cobrando más de lo que esperaba

1. Revisa Dashboard → Usage. Mira qué métrica se ha disparado.
2. Si es bandwidth: ¿están subiendo fotos enormes sin comprimir? Comprueba el límite de tamaño en el upload.
3. Si es invocaciones: ¿hay un bucle infinito en algún lado? Revisa logs.
4. Si todo es legítimo, plantea pasar al plan Pro o llegar a un acuerdo con la profesora sobre el coste.

---

### Gemini está cobrando más de lo que esperaba

1. Consola de Google Cloud → AI / Gemini → Usage.
2. Mira qué cuesta más: input, output o cache storage.
3. **Si es cache storage:** quizás el TTL está demasiado largo. Reducirlo o dejar que caduque tras 1h de inactividad.
4. **Si es input/output:** ¿ha crecido mucho el número de mensajes? ¿el contexto es mayor del esperado?

Ver [06-COSTES.md](06-COSTES.md) para las optimizaciones.

---

### Una alumna se queja de que el chat va lento

**Diagnóstico:**

1. ¿Es lentitud en cargar la app o en recibir respuesta del bot?
2. **App lenta:** revisa Vercel Speed Insights. Probablemente es bundle size o imágenes.
3. **Respuestas lentas del bot:** Gemini 2.5 Flash es el más rápido de su gama. Si va lento, puede ser:
   - Streaming desactivado por error → activar.
   - Demasiado contexto en el mensaje → revisar tamaño del historial.
   - Latencia regional → Vercel y Supabase tienen regiones; ver dónde están desplegados.

---

### Quiero pausar la app temporalmente

**Opciones:**

1. **Mantenimiento simple:** poner una página de mantenimiento como middleware. La gente entra y ve "vuelvo en X". Los datos siguen ahí.
2. **Apagado total:** desactivar el deployment en Vercel. La URL devuelve error.

**Nunca borres la base de datos** "para limpiar". Los datos de las alumnas son sagrados.

---

### Una alumna pide eliminar su cuenta (RGPD)

```bash
npm run delete-student -- alumna@email.com
```

El script borra:

- El usuario en Supabase Auth.
- Su `profile`, `messages` y `conversation_summaries`.
- Todas sus fotos en Storage.

Operación irreversible. Pide confirmación antes. Ver [05-SEGURIDAD.md](05-SEGURIDAD.md) para más sobre RGPD.

---

### Una alumna pide ver todos sus datos (RGPD)

```bash
npm run export-student-data -- alumna@email.com
```

Genera un ZIP con:

- Su `profile` en JSON.
- Todos sus `messages` en un archivo de texto cronológico.
- Todas sus fotos.
- El resumen de conversación.

Se lo envías por email cifrado o por un servicio de transferencia segura.

---

### Quiero invitar a la profesora a probar la app

Crea su cuenta con `npm run create-student -- profesora@email.com`. Internamente es una alumna más, sin privilegios especiales. Para diferenciarla en el futuro, podemos añadir un campo `role` en `profiles`, pero no es urgente.

---

### He hecho un cambio en el código y quiero probarlo antes de desplegar

```bash
npm run dev
```

Levanta la app en `http://localhost:3000` con hot reload. Las alumnas reales no lo ven hasta que hagas `git push`.

Si quieres probar contra la base de datos de producción (cuidado): asegúrate de que `.env.local` apunta a Supabase real. Si quieres una BD aparte para pruebas, crea un segundo proyecto Supabase y añade un `.env.local.test`.
