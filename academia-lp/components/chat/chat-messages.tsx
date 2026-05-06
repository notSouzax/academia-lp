'use client'

import { useEffect, useRef } from 'react'
import type { UIMessage } from 'ai'

type Props = {
  messages: UIMessage[]
  isStreaming: boolean
}

export function ChatMessages({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
        Empieza la conversación con una pregunta sobre el método.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-4">
      {messages.map((m) => {
        const text = m.parts
          .map((p) => (p.type === 'text' ? p.text : ''))
          .join('')

        const isUser = m.role === 'user'
        return (
          <div
            key={m.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                isUser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {text}
            </div>
          </div>
        )
      })}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
            …
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
