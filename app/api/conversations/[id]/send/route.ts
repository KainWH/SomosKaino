// POST /api/conversations/[id]/send — envía mensaje manual al cliente

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const body = await request.json()
  const { message } = body
  if (!message?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 })

  // Obtener la conversación con el contacto
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, contacts ( phone )")
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!conversation) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

  const contact = Array.isArray(conversation.contacts)
    ? conversation.contacts[0]
    : conversation.contacts

  // Obtener credenciales de WhatsApp del tenant
  const { data: whatsappConfig } = await supabase
    .from("whatsapp_configs")
    .select("phone_number_id, access_token")
    .eq("tenant_id", tenant.id)
    .single()

  if (!whatsappConfig?.phone_number_id || !whatsappConfig?.access_token) {
    return NextResponse.json({ error: "WhatsApp no configurado" }, { status: 400 })
  }

  // Enviar mensaje por WhatsApp
  const sent = await sendWhatsAppMessage({
    to:            contact!.phone,
    message:       message.trim(),
    phoneNumberId: whatsappConfig.phone_number_id,
    accessToken:   whatsappConfig.access_token,
  })

  // Guardar en la BD
  await supabase.from("messages").insert({
    conversation_id:     params.id,
    content:             message.trim(),
    direction:           "outbound",
    sent_by_ai:          false,
    whatsapp_message_id: sent?.messages?.[0]?.id ?? null,
  })

  return NextResponse.json({ success: true })
}
