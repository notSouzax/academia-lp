'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'

type Props = {
  initialMessages: UIMessage[]
}

export function ChatView({ initialMessages }: Props) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: initialMessages,
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  function handleSend(text: string) {
    sendMessage({ text })
  }

  return (
    <div className="flex h-full flex-col">
      <ChatMessages messages={messages} isStreaming={isStreaming} />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  )
}
