// POST /api/conversations/[id]/send-location — envía ubicación de la tienda

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppLocation } from "@/lib/whatsapp"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  // Coordenadas de la tienda desde variables de entorno
  const lat     = parseFloat(process.env.STORE_LATITUDE  ?? "0")
  const lng     = parseFloat(process.env.STORE_LONGITUDE ?? "0")
  const name    = process.env.STORE_NAME    ?? "Nuestra tienda"
  const address = process.env.STORE_ADDRESS ?? ""

  if (!lat || !lng) return NextResponse.json({ error: "Ubicación de tienda no configurada" }, { status: 400 })

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, contacts ( phone )")
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .single()
  if (!conversation) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

  const contact = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts

  const { data: waConfig } = await supabase
    .from("whatsapp_configs")
    .select("phone_number_id, access_token")
    .eq("tenant_id", tenant.id)
    .single()
  if (!waConfig?.phone_number_id || !waConfig?.access_token)
    return NextResponse.json({ error: "WhatsApp no configurado" }, { status: 400 })

  const sent = await sendWhatsAppLocation({
    to:            contact!.phone,
    latitude:      lat,
    longitude:     lng,
    name,
    address,
    phoneNumberId: waConfig.phone_number_id,
    accessToken:   waConfig.access_token,
  })

  await supabase.from("messages").insert({
    conversation_id:     params.id,
    content:             `📍 ${name}${address ? ` — ${address}` : ""}`,
    direction:           "outbound",
    sent_by_ai:          false,
    message_type:        "location",
    whatsapp_message_id: sent?.messages?.[0]?.id ?? null,
  })

  return NextResponse.json({ success: true })
}
