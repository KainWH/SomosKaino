"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Megaphone } from "lucide-react"

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

        // Banner especial para mensajes de origen de anuncio
        if (msg.message_type === "referral") {
          let headline = msg.content
          let body:     string | null = null
          let platform = "Meta Ads"
          try {
            const parsed = JSON.parse(msg.content)
            headline = parsed.headline ?? msg.content
            body     = parsed.body ?? null
            platform = parsed.platform ?? "Meta Ads"
          } catch { /* formato antiguo */ }

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
              <div className="flex justify-center my-3">
                <div className="flex flex-col items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium px-4 py-2.5 rounded-2xl max-w-xs text-center">
                  <div className="flex items-center gap-2">
                    <Megaphone size={12} />
                    <span>{platform} · <span className="font-bold">{headline}</span></span>
                  </div>
                  {body && (
                    <span className="text-amber-300/80 font-normal">{body}</span>
                  )}
                </div>
              </div>
            </div>
          )
        }

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
                  {msg.message_type === "audio" ? (
                    <div className="flex flex-col gap-1.5 py-0.5">
                      <span className="text-xs opacity-60">🎤 Nota de voz</span>
                      <audio
                        controls
                        preload="none"
                        className="w-full max-w-[260px]"
                        style={{ minHeight: "44px" }}
                        src={
                          msg.content?.startsWith("http")
                            ? msg.content
                            : msg.media_id ? `/api/media/${msg.media_id}` : undefined
                        }
                      />
                    </div>
                  ) : msg.message_type === "image" ? (() => {
                    const src = msg.content?.startsWith("http")
                      ? msg.content
                      : msg.media_id ? `/api/media/${msg.media_id}` : null
                    if (!src) return <span className="text-xs opacity-60">📷 Imagen no disponible</span>
                    return (
                      <img
                        src={src}
                        alt="Imagen"
                        className="rounded-xl max-w-[240px] max-h-[320px] object-cover cursor-pointer"
                        onClick={() => window.open(src, "_blank")}
                      />
                    )
                  })() : msg.message_type === "location" ? (() => {
                    // Extraer nombre y dirección del content "📍 Nombre — Dirección"
                    const raw     = msg.content.replace(/^📍\s*/, "")
                    const sepIdx  = raw.indexOf(" — ")
                    const locName = sepIdx !== -1 ? raw.slice(0, sepIdx) : raw
                    const locAddr = sepIdx !== -1 ? raw.slice(sepIdx + 3) : ""
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName + (locAddr ? `, ${locAddr}` : ""))}`
                    return (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 min-w-[200px] group/loc"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isInbound ? "bg-slate-700/60" : "bg-green-500/20"
                        }`}>
                          <MapPin size={18} className={isInbound ? "text-slate-400" : "text-white"} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold leading-tight truncate">{locName}</span>
                          {locAddr && <span className="text-[11px] opacity-70 truncate mt-0.5">{locAddr}</span>}
                          <span className={`text-[10px] mt-1 underline underline-offset-2 ${
                            isInbound ? "text-blue-400" : "text-green-200"
                          }`}>Ver en Maps</span>
                        </div>
                      </a>
                    )
                  })() : (
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
