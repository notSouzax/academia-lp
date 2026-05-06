'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { Button } from '@/components/ui/button'

type Props = {
  initialMessages: UIMessage[]
}

export function ChatView({ initialMessages }: Props) {
  const { messages, sendMessage, status, error, regenerate, clearError } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: initialMessages,
  })

  const isStreaming = status === 'streaming' || status === 'submitted'
  const hasError = status === 'error' || !!error

  function handleSend(text: string) {
    if (hasError) clearError?.()
    sendMessage({ text })
  }

  function handleRetry() {
    clearError?.()
    regenerate?.()
  }

  return (
    <div className="flex h-full flex-col">
      <ChatMessages messages={messages} isStreaming={isStreaming} />
      {hasError && (
        <div className="flex items-center justify-between gap-2 border-t bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>
            Algo ha fallado al obtener la respuesta.
            {error?.message ? ` (${error.message})` : ''}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
            Reintentar
          </Button>
        </div>
      )}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  )
}
