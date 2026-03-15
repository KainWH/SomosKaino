// Vista de conversación — ruta: /inbox/[id]

import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import MessagesView from "./messages-view"
import ConversationHeader from "./conversation-header"
import MessageInput from "./message-input"

// Genera un color único y consistente basado en el nombre/teléfono del contacto
function getAvatarColor(seed: string): string {
  const colors = [
    "#16a34a", "#2563eb", "#9333ea", "#ea580c",
    "#0891b2", "#be185d", "#ca8a04", "#dc2626",
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

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
    .select(`id, status, ai_paused, contacts ( id, name, phone )`)
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!conversation) notFound()

  const contact = Array.isArray(conversation.contacts)
    ? conversation.contacts[0]
    : conversation.contacts

  const displayName  = contact?.name ?? contact?.phone ?? "Desconocido"
  const avatarColor  = getAvatarColor(contact?.phone ?? displayName)

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, direction, sent_by_ai, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })

  return (
    <div className="flex flex-col h-full -m-6">

      <ConversationHeader
        conversationId={conversation.id}
        displayName={displayName}
        phone={contact?.phone ?? ""}
        status={conversation.status}
        aiPaused={conversation.ai_paused ?? false}
        avatarColor={avatarColor}
      />

      {/* ── Mensajes ── */}
      <div className="flex-1 overflow-auto px-5 py-4 bg-gray-50">
        <MessagesView
          messages={messages ?? []}
          avatarColor={avatarColor}
          contactInitial={displayName[0].toUpperCase()}
          conversationId={conversation.id}
        />
      </div>

      <MessageInput conversationId={conversation.id} />

    </div>
  )
}
