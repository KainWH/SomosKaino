"use client"

import Link from "next/link"
import { Bot, ChevronRight } from "lucide-react"

type Msg = { content: string; direction: "inbound" | "outbound"; sent_by_ai: boolean; created_at: string }
type Contact = { id: string; name: string | null; phone: string }
type Conv = {
  id: string; status: string; ai_paused: boolean; updated_at: string
  contacts: Contact | Contact[] | null
  messages: Msg[]
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-rose-500",  "bg-amber-500",  "bg-cyan-500",
]

const STATUS_TAGS: Record<string, { label: string; color: string }> = {
  new:        { label: "Nuevo lead",  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  qualified:  { label: "Calificado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  pending:    { label: "Pendiente",  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  resolved:   { label: "Resuelto",   color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
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
  const open = conversations.filter((c) => c.status === "open").slice(0, 6)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Conversaciones activas</h2>
          <p className="text-xs text-gray-400 mt-0.5">WhatsApp en tiempo real</p>
        </div>
        <Link href="/inbox" className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-0.5 hover:underline">
          Ver todas <ChevronRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {open.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
            <Bot size={28} strokeWidth={1.5} />
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
                className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-l-2 ${
                  isActive ? "border-l-blue-500 bg-blue-50 dark:bg-blue-950" : "border-l-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-full ${avatarColor(name)} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{initials}</span>
                  </div>
                  {!conv.ai_paused && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0" suppressHydrationWarning>{formatTime(conv.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400 truncate flex-1">{preview}</p>
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
