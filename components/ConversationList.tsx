"use client"

import Link from "next/link"
import { Bot, ChevronRight, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

type Msg     = { content: string; direction: "inbound" | "outbound"; sent_by_ai: boolean; created_at: string }
type Contact = { id: string; name: string | null; phone: string }
type Conv    = {
  id: string; status: string; ai_paused: boolean; updated_at: string
  contacts: Contact | Contact[] | null
  messages: Msg[]
}

const AVATAR_COLORS = [
  "from-[#FF6D00] to-[#cc5700]",
  "from-[#40C4FF] to-[#0099cc]",
  "from-[#b36dff] to-[#8040cc]",
  "from-[#FF6D00] to-[#ff9a4d]",
  "from-[#00e5cc] to-[#00b3a0]",
  "from-[#40C4FF] to-[#80D8FF]",
]

const STATUS_TAGS: Record<string, { label: string; color: string }> = {
  new:       { label: "Nuevo lead", color: "bg-[#40C4FF]/10 text-[#40C4FF] border border-[#40C4FF]/25" },
  qualified: { label: "Calificado", color: "bg-[#FF6D00]/10 text-[#FF6D00] border border-[#FF6D00]/25" },
  pending:   { label: "Pendiente",  color: "bg-[#b36dff]/10 text-[#b36dff] border border-[#b36dff]/25" },
  resolved:  { label: "Resuelto",   color: "bg-[#1f2b49] text-[#a3aac4] border border-[#1f2b49]" },
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
  conversations: initial,
  activeId,
  tenantId,
}: {
  conversations: Conv[]
  activeId?: string
  tenantId?: string
}) {
  const [conversations, setConversations] = useState<Conv[]>(initial)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!tenantId) return
    const supabase = createClient()

    const refresh = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, status, ai_paused, updated_at, contacts ( id, name, phone ), messages ( content, direction, sent_by_ai, created_at )")
        .eq("tenant_id", tenantId)
        .eq("status", "open")
        .order("updated_at", { ascending: false })
        .limit(8)
      if (data) setConversations(data as Conv[])
    }

    const channel = supabase
      .channel("convlist-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, refresh)
      .subscribe()

    const interval = setInterval(refresh, 8000)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [tenantId])

  const open = conversations
    .filter((c) => c.status === "open")
    .filter((c) => {
      if (!query) return true
      const contact = getContact(c)
      const name    = contact?.name ?? contact?.phone ?? ""
      return name.toLowerCase().includes(query.toLowerCase())
    })

  return (
    <div className="h-full flex flex-col rounded-2xl border border-[#1f2b49] overflow-hidden" style={{ background: "#0a1628" }}>

      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1f2b49] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#dee5ff]">Conversaciones activas</h2>
          <p className="text-xs text-[#a3aac4] mt-0.5">WhatsApp en tiempo real</p>
        </div>
        <Link href="/inbox" className="text-xs text-[#40C4FF] font-medium flex items-center gap-0.5 hover:text-[#40C4FF]/80 transition-colors shrink-0">
          Ver todas <ChevronRight size={13} />
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="px-4 py-3 border-b border-[#1f2b49]/60">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a4460]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversación..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#060e20] border border-[#1f2b49] rounded-xl text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:ring-1 focus:ring-[#FF6D00]/30 focus:border-[#FF6D00]/40 transition-all"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-[#1f2b49]/60 flex-1 overflow-y-auto">
        {open.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-[#3a4460]">
            <Bot size={36} strokeWidth={1.5} />
            <p className="text-base">Sin conversaciones activas</p>
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
                className={`flex items-center gap-4 px-5 py-4 transition-all duration-150 border-l-2 ${
                  isActive
                    ? "border-l-[#FF6D00] bg-[#FF6D00]/5"
                    : "border-l-transparent hover:bg-[#0d1a35]"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center shadow-md`}>
                    <span className="text-sm font-bold text-white">{initials}</span>
                  </div>
                  {!conv.ai_paused && (
                    <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-[#FF6D00] border-2 border-[#0a1628] rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[15px] font-semibold text-[#dee5ff] truncate">{name}</span>
                    <span className="text-xs text-[#a3aac4] shrink-0" suppressHydrationWarning>
                      {formatTime(conv.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-[#a3aac4] truncate flex-1">{preview}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${tag.color}`}>
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
