"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

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

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now   = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  if (date.toDateString() === yesterday.toDateString()) return "Ayer"
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

function getContact(conv: Conv) {
  return Array.isArray(conv.contacts) ? conv.contacts[0] : conv.contacts
}

function getLastMsg(conv: Conv): Msg | undefined {
  const msgs = Array.isArray(conv.messages) ? conv.messages : []
  return msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
}

export default function InboxList({
  initialConversations,
  tenantId,
}: {
  initialConversations: Conv[]
  tenantId: string
}) {
  const [conversations, setConversations] = useState<Conv[]>(initialConversations)
  const [search, setSearch]               = useState("")
  const [filter, setFilter]               = useState<Filter>("all")

  useEffect(() => {
    const supabase = createClient()
    const poll = async () => {
      const { data } = await supabase
        .from("conversations")
        .select(`id, status, ai_paused, updated_at, contacts ( id, name, phone ), messages ( content, direction, sent_by_ai, created_at )`)
        .eq("tenant_id", tenantId)
        .order("updated_at", { ascending: false })
      if (data) setConversations(data as Conv[])
    }
    const interval = setInterval(poll, 8000)
    return () => clearInterval(interval)
  }, [tenantId])

  const filtered = conversations.filter((conv) => {
    const contact = getContact(conv)
    const name    = (contact?.name ?? contact?.phone ?? "").toLowerCase()
    const phone   = (contact?.phone ?? "").toLowerCase()
    const matchSearch = search === "" || name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase())
    const lastMsg  = getLastMsg(conv)
    const isUnread = lastMsg?.direction === "inbound" && conv.status === "open"
    if (filter === "unread")  return matchSearch && isUnread
    if (filter === "closed")  return matchSearch && conv.status === "closed"
    return matchSearch
  })

  const unreadCount = conversations.filter((c) => {
    const last = getLastMsg(c)
    return last?.direction === "inbound" && c.status === "open"
  }).length

  return (
    <div className="flex flex-col gap-4">

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contacto o teléfono..."
          className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          ["all",    "Todos"],
          ["unread", `Sin responder${unreadCount > 0 ? ` (${unreadCount})` : ""}`],
          ["closed", "Cerradas"],
        ] as [Filter, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
              filter === val ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center">
          <p className="text-3xl mb-2">💬</p>
          <p className="text-gray-500 text-sm">
            {search ? "No se encontraron conversaciones" : "No hay conversaciones aquí"}
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden divide-y">
          {filtered.map((conv) => {
            const contact     = getContact(conv)
            const displayName = contact?.name ?? contact?.phone ?? "Desconocido"
            const lastMsg     = getLastMsg(conv)
            const isUnread    = lastMsg?.direction === "inbound" && conv.status === "open"
            const preview     = lastMsg
              ? `${lastMsg.direction === "outbound" ? (lastMsg.sent_by_ai ? "🤖 " : "Tú: ") : ""}${lastMsg.content}`
              : "Sin mensajes"

            return (
              <Link
                key={conv.id}
                href={`/inbox/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  isUnread ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {displayName[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                        {displayName}
                      </span>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        title={conv.ai_paused ? "Bot pausado" : "Bot activo"}
                        className={`w-1.5 h-1.5 rounded-full ${conv.ai_paused ? "bg-orange-400" : "bg-green-500"}`}
                      />
                      <span className="text-xs text-gray-400">{formatDate(conv.updated_at)}</span>
                    </div>
                  </div>
                  <p className={`text-xs truncate ${isUnread ? "text-gray-600" : "text-gray-400"}`}>
                    {preview}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
