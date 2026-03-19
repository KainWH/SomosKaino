// Contactos y Leads — /contacts
// Server Component: fetches contacts + last conversation + last message

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ContactsTable from "./contacts-table"

export type LeadStatus      = "nuevo" | "calificado" | "mostrando"
export type LeadTemperature = "hot" | "warm" | "cold"

export interface Lead {
  id:                 string
  name:               string
  phone:              string
  initials:           string
  avatarColor:        string
  source:             "whatsapp" | "manual"
  status:             LeadStatus
  temperature:        LeadTemperature
  score:              number
  lastMessageAt:      string | null
  lastMessagePreview: string | null
  conversationId:     string | null
  notes:              string | null
  createdAt:          string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#14b8a6",
]

function pickColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

function deriveTemperature(lastMsgAt: string | null): LeadTemperature {
  if (!lastMsgAt) return "cold"
  const hours = (Date.now() - new Date(lastMsgAt).getTime()) / 36e5
  if (hours < 24)  return "hot"
  if (hours < 168) return "warm"  // 7 days
  return "cold"
}

function deriveStatus(convStatus: string | null, convCount: number): LeadStatus {
  if (convCount === 0 || !convStatus) return "nuevo"
  if (convStatus === "closed")        return "calificado"
  return "mostrando"
}

function computeScore(lastMsgAt: string | null, msgCount: number): number {
  if (!lastMsgAt) return 0
  const hours  = (Date.now() - new Date(lastMsgAt).getTime()) / 36e5
  let score = Math.min(msgCount * 8, 60)          // max 60 pts por actividad
  if (hours < 1)    score += 40
  else if (hours < 24)  score += 28
  else if (hours < 168) score += 14
  return Math.min(Math.round(score), 100)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ContactsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) redirect("/login")

  // Fetch contacts with their conversations and latest messages
  const { data: raw } = await supabase
    .from("contacts")
    .select(`
      id, name, phone, notes, created_at, last_message_at,
      conversations (
        id, status, updated_at,
        messages ( content, direction, created_at )
      )
    `)
    .eq("tenant_id", tenant.id)
    .is("conversations.deleted_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  const leads: Lead[] = (raw ?? []).map((c) => {
    const displayName = c.name ?? c.phone ?? "Desconocido"
    const initials    = displayName.slice(0, 2).toUpperCase()

    // Get the most recent open conversation (or any)
    const convs = Array.isArray(c.conversations) ? c.conversations : []
    const conv  = convs.find((cv: { status: string }) => cv.status === "open") ?? convs[0] ?? null

    // Last message across all conversations
    const allMessages = convs.flatMap((cv: { messages: { content: string; direction: string; created_at: string }[] }) =>
      Array.isArray(cv.messages) ? cv.messages : []
    ).sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastMsg = allMessages[0] ?? null

    const lastMsgAt = c.last_message_at ?? lastMsg?.created_at ?? null

    return {
      id:                 c.id,
      name:               displayName,
      phone:              c.phone,
      initials,
      avatarColor:        pickColor(displayName),
      source:             "whatsapp" as const,
      status:             deriveStatus(conv?.status ?? null, convs.length),
      temperature:        deriveTemperature(lastMsgAt),
      score:              computeScore(lastMsgAt, allMessages.length),
      lastMessageAt:      lastMsgAt,
      lastMessagePreview: lastMsg?.content ?? null,
      conversationId:     conv?.id ?? null,
      notes:              c.notes ?? null,
      createdAt:          c.created_at,
    }
  })

  return (
    <div className="flex-1 overflow-auto">
      <ContactsTable leads={leads} tenantId={tenant.id} />
    </div>
  )
}
