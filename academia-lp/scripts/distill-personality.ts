import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { readRawPersonality, writeDistilledPersonality } from '@/lib/brain/storage'
import { OFFLINE_MODEL } from '@/lib/ai'
import { loadEnv } from './lib/env'

const MODEL_ID = OFFLINE_MODEL

// Free tier de Gemini Flash: 250k tokens/min input. Cada chunk apunta a ~120k chars (~30k tokens),
// muy holgado, y esperamos entre llamadas para no saturar.
const CHUNK_CHAR_SIZE = 120_000
const DELAY_BETWEEN_CALLS_MS = 15_000

const PARTIAL_PROMPT = `Te paso UN FRAGMENTO de transcripciones literales de Lidiane (profesora de micropigmentación de cejas, método "Nardo Academy") hablando en directos, talleres y vídeos.

Tu trabajo es extraer material útil de ESTE fragmento, en formato markdown limpio. Si una sección no tiene contenido relevante en este fragmento concreto, déjala con "(nada relevante en este fragmento)".

Devuelve EXACTAMENTE este formato:

## Muletillas

Lista de muletillas, latiguillos y expresiones cortas EXACTAS de Lidiane que aparezcan en este fragmento. Cita literal. Una por línea con guion. Solo lo que aparezca aquí; no inventes.

## Ejemplos de explicaciones

UN fragmento literal (entre 80 y 200 palabras) donde se la vea explicando algo técnico o didáctico. Cita exacta del texto, sin adornos. Pónlo entre triple comillas (\`\`\`). Elige el mejor ejemplo de este fragmento. Si no hay ningún fragmento explicativo de esa longitud, déjalo vacío.

## Datos sobre Lidiane

Cosas que mencione sobre sí misma, su historia, su pasado, su familia, su formación, su trayectoria. Síntesis breve. Una idea por línea con guion. Solo lo que aparezca en este fragmento.

## Ideas y filosofía

Cosas que ella considera importantes en la profesión: visión, valores, principios. Síntesis breve. Una por línea con guion.

## Críticas y rechazos

Cosas que ella critica o desaconseja del sector (técnicas mal aplicadas, malas prácticas, mitos). Síntesis breve. Una por línea con guion.

Reglas:
- En "muletillas" y "ejemplos", cita LITERAL.
- En "datos", "ideas" y "críticas", síntesis breve.
- No inventes. Si no aparece, no lo pongas.
- No menciones "el fragmento", "transcripción", "vídeo", "audio", "directo".
- No incluyas saludos, despedidas, ruidos de transcripción, marcadores temporales.

Aquí va el fragmento:

---

`

const CONSOLIDATE_PROMPT = `A continuación tienes varios extractos parciales sobre Lidiane (profesora de micropigmentación). Cada extracto se generó analizando un trozo distinto de sus transcripciones. Tu trabajo es consolidarlos en UN SOLO documento limpio y final.

Devuelve EXACTAMENTE este formato en markdown, en español, sin preámbulos, escrito todo en primera persona como si lo dijera ella misma:

# Sobre mí

Un párrafo de 200-300 palabras en primera persona ("Soy Lidiane…", "Yo creo que…", "Mi historia es…"). Sintetiza lo que aparece en los extractos sobre quién es ella, de dónde viene, su trayectoria, por qué hace lo que hace, su filosofía. Si los extractos no traen suficiente material biográfico, omite los datos faltantes en lugar de inventar.

# Mi forma de hablar

## Muletillas y expresiones

Lista DEDUPLICADA y curada de las 30-50 muletillas/expresiones más representativas. Cita literal. Una por línea con guion. Si hay variantes parecidas, quédate con la más característica.

## Cómo explico

Selecciona los 3 MEJORES ejemplos de los disponibles en los extractos. Cada uno entre triple comillas (\`\`\`), tal cual aparece, sin editar. Que sean explicaciones técnicas o didácticas reales.

# Mis ideas y filosofía

Lista deduplicada de 10-20 puntos. Síntesis. Una por línea con guion. Que reflejen lo que ella considera importante en la profesión, en la relación con clientas, en la calidad del trabajo.

# Lo que rechazo

Lista deduplicada de 5-10 cosas que critica o desaconseja en el sector. Síntesis. Una por línea con guion.

---

Reglas estrictas:
- Voz en PRIMERA PERSONA (yo, mi, me).
- En "muletillas" y "cómo explico", cita LITERAL.
- En "sobre mí", "ideas" y "rechazo", síntesis libre.
- No menciones "extractos", "transcripciones", "documentos", "fragmentos".
- El documento debe leerse como si Lidiane lo hubiera escrito ella misma.

Aquí van los extractos parciales (separados por "===CHUNK==="):

`

function chunkText(text: string, size: number): string[] {
  const out: string[] = []
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size))
  }
  return out
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  loadEnv(['GOOGLE_GENERATIVE_AI_API_KEY'] as const)

  console.log('1) Leyendo personalidad bruta (lib/brain/_personality.txt) ...')
  const raw = await readRawPersonality()
  if (!raw) {
    console.error('No existe lib/brain/_personality.txt. Ejecuta primero: npm run rebuild-brain')
    process.exit(1)
  }
  const inputKB = (raw.length / 1024).toFixed(1)
  console.log(`   Tamaño: ${inputKB} KB`)

  const chunks = chunkText(raw, CHUNK_CHAR_SIZE)
  console.log(`   Trozos a procesar: ${chunks.length} (de ~${(CHUNK_CHAR_SIZE / 1024).toFixed(0)} KB cada uno)`)

  console.log('')
  console.log(`2) Destilando cada trozo (esperando ${DELAY_BETWEEN_CALLS_MS / 1000}s entre llamadas) ...`)

  const partials: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    const start = Date.now()
    process.stdout.write(`   Trozo ${i + 1}/${chunks.length} ... `)
    try {
      const { text } = await generateText({
        model: google(MODEL_ID),
        prompt: PARTIAL_PROMPT + chunks[i],
      })
      partials.push(text.trim())
      const sec = ((Date.now() - start) / 1000).toFixed(1)
      console.log(`OK (${sec}s)`)
    } catch (err) {
      console.log('ERROR')
      console.error('     ', err instanceof Error ? err.message : String(err))
      throw err
    }
    if (i < chunks.length - 1) {
      await sleep(DELAY_BETWEEN_CALLS_MS)
    }
  }

  console.log('')
  console.log('3) Consolidando los extractos parciales en un único documento ...')
  await sleep(DELAY_BETWEEN_CALLS_MS)

  const combined = partials
    .map((p, i) => `===CHUNK ${i + 1}===\n\n${p}`)
    .join('\n\n')

  const start = Date.now()
  const { text: distilled, usage } = await generateText({
    model: google(MODEL_ID),
    prompt: CONSOLIDATE_PROMPT + combined,
  })
  const sec = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`   Hecho en ${sec}s.`)
  if (usage) {
    console.log(
      `   Tokens consolidación — input: ${usage.inputTokens ?? '?'}, output: ${usage.outputTokens ?? '?'}`
    )
  }

  if (!distilled || distilled.trim().length < 200) {
    console.error('La respuesta de consolidación parece vacía o incompleta. No la guardo.')
    console.error(distilled)
    process.exit(2)
  }

  const outputKB = (distilled.length / 1024).toFixed(1)
  const ratio = (raw.length / distilled.length).toFixed(0)
  console.log('')
  console.log(`4) Guardando destilado en lib/brain/_personality.distilled.txt ...`)
  console.log(`   Tamaño destilado: ${outputKB} KB (${ratio}x más pequeño que el bruto)`)
  await writeDistilledPersonality(distilled.trim())

  console.log('')
  console.log('Listo. El chat usará el destilado automáticamente en la próxima llamada.')
  console.log('Para ver el resultado: cat lib/brain/_personality.distilled.txt')
}

main().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(1)
})
