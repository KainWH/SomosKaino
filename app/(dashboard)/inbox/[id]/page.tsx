// Vista de conversación — ruta: /inbox/[id]

import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import MessagesView from "./messages-view"

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) redirect("/login")

  const { data: conversation } = await supabase
    .from("conversations")
    .select(`id, status, contacts ( id, name, phone )`)
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!conversation) notFound()

  const contact = Array.isArray(conversation.contacts)
    ? conversation.contacts[0]
    : conversation.contacts

  const displayName = contact?.name ?? contact?.phone ?? "Desconocido"

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, direction, sent_by_ai, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })

  return (
    <div className="flex flex-col h-full -m-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b flex-shrink-0 shadow-sm">
        <Link
          href="/inbox"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          ←
        </Link>
        <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {displayName[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{displayName}</p>
          <p className="text-xs text-gray-400">{contact?.phone}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          conversation.status === "open"
            ? "bg-green-50 text-green-700"
            : "bg-gray-100 text-gray-500"
        }`}>
          {conversation.status === "open" ? "Activa" : conversation.status}
        </span>
      </div>

      {/* ── Mensajes ── */}
      <div className="flex-1 overflow-auto px-5 py-4 bg-gray-50">
        <MessagesView messages={messages ?? []} />
      </div>

    </div>
  )
}
