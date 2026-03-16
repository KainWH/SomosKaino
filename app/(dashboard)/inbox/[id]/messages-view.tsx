"use client"

import { useEffect, useRef, useState } from "react"

type Message = {
  id:            string
  content:       string
  direction:     "inbound" | "outbound"
  sent_by_ai:    boolean
  created_at:    string
  message_type?: string
  media_id?:     string | null
}

type Props = {
  messages:       Message[]
  avatarColor:    string
  contactInitial: string
  conversationId: string
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })
}

function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr), now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === now.toDateString()) return "Hoy"
  if (date.toDateString() === yesterday.toDateString()) return "Ayer"
  return date.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })
}

export default function MessagesView({ messages: initial, avatarColor, contactInitial, conversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial)
  const bottomRef      = useRef<HTMLDivElement>(null)
  const isFirstRender  = useRef(true)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "instant" }) }, [])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  useEffect(() => { setMessages(initial) }, [initial])

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
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-600 text-sm">Sin mensajes en esta conversación</p>
      </div>
    )
  }

  let lastDateLabel = ""

  return (
    <div className="flex flex-col gap-1 py-4 px-5">
      {messages.map((msg) => {
        const isInbound   = msg.direction === "inbound"
        const dateLabel   = formatDateLabel(msg.created_at)
        const showDate    = dateLabel !== lastDateLabel
        lastDateLabel     = dateLabel

        return (
          <div key={msg.id}>
            {showDate && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-800/60" />
                <span className="text-[11px] text-slate-600 font-medium bg-slate-900 px-3 py-1 rounded-full border border-slate-800/60">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-slate-800/60" />
              </div>
            )}

            <div className={`flex items-end gap-2 mb-1 ${isInbound ? "justify-start" : "justify-end"}`}>
              {isInbound && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1 shadow-sm"
                  style={{ backgroundColor: avatarColor }}
                >
                  {contactInitial}
                </div>
              )}

              <div className={`max-w-[65%] flex flex-col gap-1 ${isInbound ? "items-start" : "items-end"}`}>
                <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  isInbound
                    ? "bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-2xl rounded-bl-sm"
                    : "bg-green-600 text-white rounded-2xl rounded-br-sm"
                }`}>
                  {msg.message_type === "audio" && msg.media_id ? (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs opacity-70">🎤 Nota de voz</span>
                      <audio controls preload="none" className="h-8 w-48 max-w-full" src={`/api/media/${msg.media_id}`} />
                    </div>
                  ) : msg.message_type === "image" && msg.media_id ? (
                    <img
                      src={`/api/media/${msg.media_id}`}
                      alt="Imagen"
                      className="rounded-xl max-w-[240px] max-h-[320px] object-cover cursor-pointer"
                      onClick={() => window.open(`/api/media/${msg.media_id}`, "_blank")}
                    />
                  ) : (
                    msg.content
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[10px] text-slate-600">{formatTime(msg.created_at)}</span>
                  {msg.sent_by_ai && (
                    <span className="text-[10px] text-slate-600 bg-slate-800/60 border border-slate-700/40 px-1.5 py-0.5 rounded-full">
                      🤖 IA
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
