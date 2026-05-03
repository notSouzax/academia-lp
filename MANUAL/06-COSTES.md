# 06 — Costes estimados

Estimaciones aproximadas, redondeadas al alza. Los precios reales pueden variar — verifica en cada panel antes de tomar decisiones.

## Resumen mensual aproximado

| Servicio | Coste estimado (10 alumnas activas) | Coste estimado (100 alumnas activas) |
|---|---|---|
| Vercel | $0 (free tier) | $0-20 |
| Supabase | $0 (free tier) | $25 (plan Pro) |
| Gemini 2.5 Flash | $5-15 | $30-100 |
| Vercel AI Gateway | $0 (margen incluido) | $0 (margen incluido) |
| **TOTAL aprox.** | **$5-15/mes** | **$55-145/mes** |

Estas son cifras orientativas. Lo que dispara el coste real es el volumen de mensajes y de fotos. Un análisis de foto cuesta más que un mensaje de texto porque incluye tokens de imagen.

## Detalle por servicio

### Vercel (hosting)

- **Free tier:** 100 GB de bandwidth, builds ilimitados, despliegues automáticos. **Suficiente para empezar y para meses por delante.**
- **Plan Pro ($20/mes):** cuando crezca el tráfico o necesites colaboradores. No urgente.

### Supabase (auth + DB + storage)

- **Free tier:**
  - 500 MB de DB
  - 1 GB de storage
  - 50.000 usuarios mensuales activos
  - 2 GB de bandwidth de storage
- **Plan Pro ($25/mes):**
  - 8 GB de DB, 100 GB de storage
  - Backups con retención 7→30 días
  - Soporte prioritario

**Cuándo migrar:** cuando se acerquen los límites del free tier (probablemente cuando lleguemos a ~50-100 alumnas activas).

### Gemini 2.5 Flash (vía Vercel AI Gateway)

Precios de referencia (verifica en https://ai.google.dev/pricing):

| Concepto | Precio aproximado |
|---|---|
| Input texto | ~$0.30 / 1M tokens |
| Input cacheado (con context cache) | ~$0.075 / 1M tokens (25% del normal) |
| Input imagen | ~$0.30 / 1M tokens equivalentes |
| Output | ~$2.50 / 1M tokens |
| Almacenamiento de cache | ~$1 / 1M tokens / hora |

#### Cálculo aproximado por mensaje

**Mensaje de texto típico:**
- Cerebro cacheado: 100k tokens × $0.075/1M = $0.0075 (este coste se "amortiza" entre todas las conversaciones que usen el mismo cache).
- Historial reciente: ~2k tokens × $0.30/1M = $0.0006
- Mensaje del usuario: ~50 tokens, despreciable.
- Respuesta: ~300 tokens × $2.50/1M = $0.00075

**Total por mensaje de texto: ~$0.001-0.002.**

**Mensaje con foto:**
- Mismo cache + historial.
- Imagen: ~1.5k tokens equivalentes × $0.30/1M = $0.0005.
- Respuesta más larga (evaluación estructurada): ~600 tokens × $2.50/1M = $0.0015.

**Total por mensaje con foto: ~$0.003-0.005.**

#### Almacenamiento del cache

Si mantenemos el cache activo 24/7: 100k tokens × $1/M/hora × 24h × 30 días = ~$72/mes.

**Optimización clave:** dejar que el cache caduque tras 1 hora de inactividad. Se regenera automáticamente cuando alguien chatea. Coste real: probablemente $5-15/mes en cache durante los primeros meses con poco uso, escalando con la actividad.

### Vercel AI Gateway

Margen propio de Vercel sobre los precios de los proveedores (típicamente cero o muy pequeño). Te da observabilidad y reintentos, y puede absorber failovers a otros modelos si Gemini cae. **No esperes coste extra significativo.**

## Cómo monitorizar costes

- **Vercel:** Dashboard → Usage. Te avisa por email si te acercas al límite.
- **Supabase:** Project → Settings → Usage. Igual.
- **Google AI / Gemini:** consola de Google Cloud. Configura alertas de presupuesto.

Al inicio de cada mes, dedica 5 minutos a revisar los tres paneles. Si algo se dispara, detéctalo pronto.

## Optimizaciones futuras si los costes crecen

1. **Reducir el contenido del Cerebro:** quizá no todas las transcripciones aportan lo mismo. Filtrar las menos relevantes.
2. **Resumen del historial más agresivo:** resumir tras 10 mensajes en vez de 20.
3. **Cambiar a Gemini Flash más pequeño** o a otro modelo más barato vía la AI Gateway (sin cambiar el código, solo cambiando el string del modelo).
4. **Limitar mensajes/día por alumna** si abusan (no se ha visto un caso real, pero es un seguro).
5. **Comprimir más las imágenes** antes de subirlas (el coste de imagen escala con la resolución).
