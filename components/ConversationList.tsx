"use client"

import Link from "next/link"
import { Bot, ChevronRight, Search } from "lucide-react"
import { useState } from "react"

type Msg     = { content: string; direction: "inbound" | "outbound"; sent_by_ai: boolean; created_at: string }
type Contact = { id: string; name: string | null; phone: string }
type Conv    = {
  id: string; status: string; ai_paused: boolean; updated_at: string
  contacts: Contact | Contact[] | null
  messages: Msg[]
}

const AVATAR_COLORS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-rose-500 to-rose-600",
  "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-600",
]

const STATUS_TAGS: Record<string, { label: string; color: string }> = {
  new:       { label: "Nuevo lead", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  qualified: { label: "Calificado", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  pending:   { label: "Pendiente",  color: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  resolved:  { label: "Resuelto",   color: "bg-slate-700/50 text-slate-400 border border-slate-700" },
}

function getContact(conv: Conv): Contact | null {
  return Array.isArray(conv.contacts) ? conv.contacts[0] ?? null : conv.contacts
}

function getLastMsg(conv: Conv): Msg | undefined {
  return (conv.messages ?? []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
}

function formatTime(d: string) {
  const date = new Date(d), now = new Date()
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })
  return date.toLocaleDateString("es-DO", { day: "numeric", month: "short" })
}

function getStatusTag(conv: Conv, lastMsg?: Msg) {
  if (conv.status === "closed") return STATUS_TAGS.resolved
  if (!lastMsg) return STATUS_TAGS.new
  if (lastMsg.direction === "inbound") return STATUS_TAGS.pending
  if (lastMsg.sent_by_ai) return STATUS_TAGS.qualified
  return STATUS_TAGS.new
}

function avatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

export default function ConversationList({
  conversations,
  activeId,
}: {
  conversations: Conv[]
  activeId?: string
}) {
  const [query, setQuery] = useState("")

  const open = conversations
    .filter((c) => c.status === "open")
    .filter((c) => {
      if (!query) return true
      const contact = getContact(c)
      const name    = contact?.name ?? contact?.phone ?? ""
      return name.toLowerCase().includes(query.toLowerCase())
    })
    .slice(0, 6)

  return (
    <div className="h-full bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Conversaciones activas</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">WhatsApp en tiempo real</p>
        </div>
        <Link href="/inbox" className="text-[11px] text-blue-400 font-medium flex items-center gap-0.5 hover:text-blue-300 transition-colors shrink-0">
          Ver todas <ChevronRight size={11} />
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="px-4 py-3 border-b border-slate-800/40">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversación..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/50 border border-slate-700/40
              rounded-lg text-slate-300 placeholder-slate-600
              focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-slate-800/40 flex-1">
        {open.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-slate-600">
            <Bot size={26} strokeWidth={1.5} />
            <p className="text-sm">Sin conversaciones activas</p>
          </div>
        ) : (
          open.map((conv) => {
            const contact  = getContact(conv)
            const lastMsg  = getLastMsg(conv)
            const name     = contact?.name ?? contact?.phone ?? "Desconocido"
            const initials = name.slice(0, 2).toUpperCase()
            const isActive = conv.id === activeId
            const tag      = getStatusTag(conv, lastMsg)
            const preview  = lastMsg
              ? `${lastMsg.direction === "outbound" ? (lastMsg.sent_by_ai ? "🤖 " : "Tú: ") : ""}${lastMsg.content}`
              : "Sin mensajes"

            return (
              <Link
                key={conv.id}
                href={`/inbox/${conv.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 transition-all duration-150 border-l-2 ${
                  isActive
                    ? "border-l-blue-500 bg-blue-500/5"
                    : "border-l-transparent hover:bg-slate-800/40"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center shadow-sm`}>
                    <span className="text-[11px] font-bold text-white">{initials}</span>
                  </div>
                  {!conv.ai_paused && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-slate-200 truncate">{name}</span>
                    <span className="text-[10px] text-slate-600 shrink-0" suppressHydrationWarning>
                      {formatTime(conv.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-slate-500 truncate flex-1">{preview}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${tag.color}`}>
                      {tag.label}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
