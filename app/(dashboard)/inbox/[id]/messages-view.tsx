"use client"

import { useEffect, useRef, useState } from "react"

type Message = {
  id: string
  content: string
  direction: "inbound" | "outbound"
  sent_by_ai: boolean
  created_at: string
}

type Props = {
  messages: Message[]
  avatarColor: string
  contactInitial: string
  conversationId: string
}

export default function MessagesView({ messages: initial, avatarColor, contactInitial, conversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  // Scroll instantáneo al fondo en la primera carga
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" })
  }, [])

  // Scroll suave cuando llegan mensajes nuevos (no en la primera carga)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Cuando el servidor refresca (router.refresh), actualizar desde props
  useEffect(() => {
    setMessages(initial)
  }, [initial])

  // Polling cada 3 segundos via API route (evita problemas de RLS en el browser)
  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!res.ok) return
      const data: Message[] = await res.json()
      if (data.length > 0) setMessages(data)
    }

    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [conversationId])

  if (messages.length === 0) {
    return (
      <p className="text-center text-gray-400 text-sm mt-8">
        No hay mensajes en esta conversación
      </p>
    )
  }

  let lastDateLabel = ""

  return (
    <>
      {messages.map((msg) => {
        const isInbound = msg.direction === "inbound"
        const date = new Date(msg.created_at)
        const time = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

        const today     = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)

        let dateLabel = ""
        if (date.toDateString() === today.toDateString())          dateLabel = "Hoy"
        else if (date.toDateString() === yesterday.toDateString()) dateLabel = "Ayer"
        else dateLabel = date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })

        const showDateSeparator = dateLabel !== lastDateLabel
        lastDateLabel = dateLabel

        return (
          <div key={msg.id}>
            {showDateSeparator && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">{dateLabel}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            <div className={`flex items-end gap-2 mb-2 ${isInbound ? "justify-start" : "justify-end"}`}>

              {isInbound && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1"
                  style={{ backgroundColor: avatarColor }}
                >
                  {contactInitial}
                </div>
              )}

              <div className={`max-w-[65%] flex flex-col gap-1 ${isInbound ? "items-start" : "items-end"}`}>
                <div
                  className={`px-4 py-2.5 text-sm leading-relaxed ${
                    isInbound
                      ? "bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm"
                      : "bg-green-600 text-white rounded-2xl rounded-br-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-xs text-gray-400">{time}</span>
                  {msg.sent_by_ai && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">🤖 IA</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        )
      })}

      <div ref={bottomRef} />
    </>
  )
}
