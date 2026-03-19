import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import MessagesView          from "./messages-view"
import MessageInput          from "./message-input"
import LeadDetails           from "./lead-details"
import ConversationShell     from "./conversation-shell"

function getAvatarColor(seed: string): string {
  const colors = ["#16a34a", "#2563eb", "#9333ea", "#ea580c", "#0891b2", "#be185d", "#ca8a04", "#dc2626"]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase.from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) redirect("/login")

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, status, ai_paused, contacts ( id, name, phone )")
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!conversation) notFound()

  const contact      = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts
  const displayName  = contact?.name ?? contact?.phone ?? "Desconocido"
  const avatarColor  = getAvatarColor(contact?.phone ?? displayName)

  const [{ data: messages }, { data: referralMsg }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, content, direction, sent_by_ai, created_at, message_type, media_id")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("messages")
      .select("content")
      .eq("conversation_id", conversation.id)
      .eq("message_type", "referral")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  // Parsear datos del anuncio de origen
  type ReferralData = { headline: string; platform: string; image_url: string | null }
  let referralData: ReferralData | null = null
  if (referralMsg?.content) {
    try {
      referralData = JSON.parse(referralMsg.content) as ReferralData
    } catch {
      // formato antiguo (solo texto) — compatibilidad
      referralData = { headline: referralMsg.content, platform: "Meta Ads", image_url: null }
    }
  }

  return (
    <ConversationShell
      conversationId={conversation.id}
      displayName={displayName}
      phone={contact?.phone ?? ""}
      status={conversation.status}
      aiPaused={conversation.ai_paused ?? false}
      avatarColor={avatarColor}
      leadDetails={
        <LeadDetails
          displayName={displayName}
          phone={contact?.phone ?? ""}
          avatarColor={avatarColor}
          aiPaused={conversation.ai_paused ?? false}
          status={conversation.status}
          conversationId={conversation.id}
          referral={referralData}
        />
      }
    >
      <div className="flex-1 overflow-y-auto">
        <MessagesView
          messages={messages ?? []}
          avatarColor={avatarColor}
          contactInitial={displayName[0].toUpperCase()}
          conversationId={conversation.id}
        />
      </div>
      <MessageInput conversationId={conversation.id} />
    </ConversationShell>
  )
}
