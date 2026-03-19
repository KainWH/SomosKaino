import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [{ data: messages }, { data: contacts }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, content, created_at, conversations!inner(tenant_id, contacts(name, phone))")
      .eq("conversations.tenant_id", tenant.id)
      .eq("direction", "inbound")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("contacts")
      .select("id, name, phone, created_at")
      .eq("tenant_id", tenant.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  type Notif = {
    id: string
    type: "message" | "contact"
    title: string
    sub: string
    created_at: string
  }

  const notifs: Notif[] = []

  for (const msg of messages ?? []) {
    const conv = msg.conversations as any
    const contact = Array.isArray(conv?.contacts) ? conv.contacts[0] : conv?.contacts
    const name = contact?.name || contact?.phone || "Desconocido"
    const preview = msg.content.length > 50
      ? msg.content.slice(0, 50) + "…"
      : msg.content
    notifs.push({
      id:         `msg_${msg.id}`,
      type:       "message",
      title:      `Nuevo mensaje de ${name}`,
      sub:        preview,
      created_at: msg.created_at,
    })
  }

  for (const c of contacts ?? []) {
    notifs.push({
      id:         `contact_${c.id}`,
      type:       "contact",
      title:      `Nuevo lead: ${c.name || c.phone}`,
      sub:        c.phone,
      created_at: c.created_at,
    })
  }

  notifs.sort((a, b) => b.created_at.localeCompare(a.created_at))

  return NextResponse.json(notifs.slice(0, 15))
}
