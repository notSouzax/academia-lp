import { createInterface } from 'node:readline'

export async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(`${question} (escribe "yes" para confirmar): `, resolve)
    })
    return answer.trim().toLowerCase() === 'yes'
  } finally {
    rl.close()
  }
}
