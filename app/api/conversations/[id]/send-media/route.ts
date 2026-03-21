// POST /api/conversations/[id]/send-media — envía imagen o audio desde SomosKaino
// Recibe FormData con: file (Blob), type ("image" | "audio")

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadMedia, sendWhatsAppMedia } from "@/lib/whatsapp"

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

  const formData = await request.formData()
  const file = formData.get("file") as Blob | null
  const type = formData.get("type") as "image" | "audio" | null

  if (!file || !type) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })

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

  // Obtener credenciales de WhatsApp
  const { data: whatsappConfig } = await supabase
    .from("whatsapp_configs")
    .select("phone_number_id, access_token")
    .eq("tenant_id", tenant.id)
    .single()

  if (!whatsappConfig?.phone_number_id || !whatsappConfig?.access_token) {
    return NextResponse.json({ error: "WhatsApp no configurado" }, { status: 400 })
  }

  const buffer        = Buffer.from(await file.arrayBuffer())
  const rawMimeType   = file.type || (type === "image" ? "image/jpeg" : "audio/ogg")
  // Meta no acepta audio/webm — lo remapeamos a audio/ogg (mismo codec Opus, compatible)
  const mimeType      = rawMimeType.startsWith("audio/webm") ? "audio/ogg" : rawMimeType
  const ext           = type === "image"
    ? (mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg")
    : (mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : "ogg")
  const filename = `${type}-${Date.now()}.${ext}`

  // Subir a Supabase Storage para poder mostrarlo en el chat
  const { data: storageData } = await supabase.storage
    .from("chat-media")
    .upload(`${tenant.id}/${filename}`, buffer, { contentType: mimeType, upsert: false })

  const { data: { publicUrl } } = supabase.storage
    .from("chat-media")
    .getPublicUrl(storageData?.path ?? `${tenant.id}/${filename}`)

  // Subir el archivo a WhatsApp
  const mediaId = await uploadMedia({
    buffer,
    mimeType,
    filename,
    phoneNumberId: whatsappConfig.phone_number_id,
    accessToken:   whatsappConfig.access_token,
  })

  if (!mediaId) return NextResponse.json({ error: "Error al subir el archivo" }, { status: 502 })

  // Enviar el mensaje de media
  const sent = await sendWhatsAppMedia({
    to:            contact!.phone,
    mediaId,
    type,
    phoneNumberId: whatsappConfig.phone_number_id,
    accessToken:   whatsappConfig.access_token,
  })

  // Guardar en la BD con la URL pública de Storage como content
  await supabase.from("messages").insert({
    conversation_id:     params.id,
    content:             publicUrl,
    direction:           "outbound",
    sent_by_ai:          false,
    whatsapp_message_id: sent?.messages?.[0]?.id ?? null,
    message_type:        type,
    media_id:            mediaId,
  })

  return NextResponse.json({ success: true })
}
