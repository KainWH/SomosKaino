"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Search, Trash2 } from "lucide-react"

type Msg = {
  content: string
  direction: "inbound" | "outbound"
  sent_by_ai: boolean
  created_at: string
}

type Conv = {
  id: string
  status: string
  ai_paused: boolean
  updated_at: string
  contacts: { id: string; name: string | null; phone: string } | { id: string; name: string | null; phone: string }[] | null
  messages: Msg[]
}

type Filter = "all" | "unread" | "closed"

const AVATAR_COLORS = [
  "from-blue-500 to-blue-600", "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600", "from-rose-500 to-rose-600",
  "from-amber-500 to-amber-600", "from-cyan-500 to-cyan-600",
]

function avatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr), now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })
  if (date.toDateString() === yesterday.toDateString()) return "Ayer"
  return date.toLocaleDateString("es-DO", { day: "numeric", month: "short" })
}

function getContact(conv: Conv) {
  return Array.isArray(conv.contacts) ? conv.contacts[0] : conv.contacts
}

function getLastMsg(conv: Conv): Msg | undefined {
  return [...(conv.messages ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
}

export default function InboxList({ initialConversations, tenantId }: { initialConversations: Conv[]; tenantId: string }) {
  const [conversations, setConversations] = useState<Conv[]>(initialConversations)
  const [search, setSearch]               = useState("")
  const [filter, setFilter]               = useState<Filter>("all")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    const poll = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, status, ai_paused, updated_at, contacts ( id, name, phone ), messages ( content, direction, sent_by_ai, created_at )")
        .eq("tenant_id", tenantId)
        .order("updated_at", { ascending: false })
      if (data) setConversations(data as Conv[])
    }
    const interval = setInterval(poll, 8000)
    return () => clearInterval(interval)
  }, [tenantId])

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" })
    if (res.ok) setConversations((prev) => prev.filter((c) => c.id !== id))
    setDeleting(null)
    setConfirmDelete(null)
  }

  const unreadCount = conversations.filter((c) => getLastMsg(c)?.direction === "inbound" && c.status === "open").length

  const filtered = conversations.filter((conv) => {
    const contact = getContact(conv)
    const name    = (contact?.name ?? contact?.phone ?? "").toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || (contact?.phone ?? "").includes(search)
    const lastMsg  = getLastMsg(conv)
    const isUnread = lastMsg?.direction === "inbound" && conv.status === "open"
    if (filter === "unread") return matchSearch && isUnread
    if (filter === "closed") return matchSearch && conv.status === "closed"
    return matchSearch
  })

  const filters: [Filter, string][] = [
    ["all",    "Todos"],
    ["unread", `Sin leer${unreadCount > 0 ? ` (${unreadCount})` : ""}`],
    ["closed", "Cerradas"],
  ]

  return (
    <>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/60 shrink-0">
        <h2 className="text-base font-semibold text-slate-200 mb-3">WhatsApp</h2>

        {/* Buscador */}
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contacto..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-800/60 border border-slate-700/40 rounded-xl
              text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40
              focus:border-green-500/40 transition-all"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
          {filters.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`flex-1 text-[11px] py-1.5 px-1 rounded-lg font-medium transition-all ${
                filter === val
                  ? "bg-slate-700 text-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-600">
            <span className="text-3xl">💬</span>
            <p className="text-sm">Sin conversaciones</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const contact     = getContact(conv)
            const displayName = contact?.name ?? contact?.phone ?? "Desconocido"
            const initials    = displayName.slice(0, 2).toUpperCase()
            const lastMsg     = getLastMsg(conv)
            const isUnread    = lastMsg?.direction === "inbound" && conv.status === "open"
            const isActive    = pathname === `/inbox/${conv.id}`
            const isConfirming = confirmDelete === conv.id
            const preview     = lastMsg
              ? `${lastMsg.direction === "outbound" ? (lastMsg.sent_by_ai ? "🤖 " : "Tú: ") : ""}${lastMsg.content}`
              : "Sin mensajes"

            return (
              <div key={conv.id} className={`group relative border-b border-slate-800/40 transition-colors ${
                isActive ? "bg-slate-800/60" : "hover:bg-slate-800/30"
              }`}>
                <Link href={`/inbox/${conv.id}`} className="flex items-center gap-3 px-4 py-3.5">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor(displayName)} flex items-center justify-center shadow-sm`}>
                      <span className="text-sm font-bold text-white">{initials}</span>
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      conv.ai_paused ? "bg-amber-400" : "bg-green-400"
                    }`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-sm truncate ${isUnread ? "font-bold text-slate-100" : "font-medium text-slate-300"}`}>
                        {displayName}
                      </span>
                      <span className="text-[10px] text-slate-600 shrink-0" suppressHydrationWarning>
                        {formatDate(lastMsg?.created_at ?? conv.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs truncate flex-1 ${isUnread ? "text-slate-400" : "text-slate-600"}`}>
                        {preview}
                      </p>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                    </div>
                  </div>
                </Link>

                {/* Botón borrar */}
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity ${
                  isConfirming ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}>
                  {isConfirming ? (
                    <>
                      <button onClick={() => handleDelete(conv.id)} disabled={!!deleting}
                        className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50">
                        {deleting === conv.id ? "..." : "Sí"}
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-600">
                        No
                      </button>
                    </>
                  ) : (
                    <button onClick={(e) => { e.preventDefault(); setConfirmDelete(conv.id) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
