// POST /api/conversations/[id]/send-product
// Envía imagen del producto + texto de detalles en secuencia

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadMedia, sendWhatsAppMedia, sendWhatsAppMessage } from "@/lib/whatsapp"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { imageUrl, message } = await request.json()
  if (!message?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 })

  // Obtener conversación + contacto
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, contacts ( phone )")
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .single()
  if (!conversation) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

  const contact = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts

  // Credenciales WhatsApp
  const { data: waConfig } = await supabase
    .from("whatsapp_configs")
    .select("phone_number_id, access_token")
    .eq("tenant_id", tenant.id)
    .single()
  if (!waConfig?.phone_number_id || !waConfig?.access_token)
    return NextResponse.json({ error: "WhatsApp no configurado" }, { status: 400 })

  // ── 1. Enviar imagen si existe ────────────────────────────────
  if (imageUrl) {
    try {
      const imgRes = await fetch(imageUrl)
      if (imgRes.ok) {
        const buffer   = Buffer.from(await imgRes.arrayBuffer())
        const mimeType = imgRes.headers.get("content-type") || "image/jpeg"

        const mediaId = await uploadMedia({
          buffer,
          mimeType,
          filename:      "product.jpg",
          phoneNumberId: waConfig.phone_number_id,
          accessToken:   waConfig.access_token,
        })

        if (mediaId) {
          const sent = await sendWhatsAppMedia({
            to:            contact!.phone,
            mediaId,
            type:          "image",
            phoneNumberId: waConfig.phone_number_id,
            accessToken:   waConfig.access_token,
          })

          await supabase.from("messages").insert({
            conversation_id:     params.id,
            content:             "🖼️ Imagen",
            direction:           "outbound",
            sent_by_ai:          false,
            whatsapp_message_id: sent?.messages?.[0]?.id ?? null,
            message_type:        "image",
            media_id:            mediaId,
          })
        }
      }
    } catch {
      // Si falla la imagen, continúa con el texto
    }
  }

  // ── 2. Enviar texto con detalles del producto ─────────────────
  const sent = await sendWhatsAppMessage({
    to:            contact!.phone,
    message:       message.trim(),
    phoneNumberId: waConfig.phone_number_id,
    accessToken:   waConfig.access_token,
  })

  await supabase.from("messages").insert({
    conversation_id:     params.id,
    content:             message.trim(),
    direction:           "outbound",
    sent_by_ai:          false,
    whatsapp_message_id: sent?.messages?.[0]?.id ?? null,
  })

  return NextResponse.json({ success: true })
}
