// API Route: /api/webhook/whatsapp
// Meta envía los mensajes de WhatsApp a esta URL (POST)
// También usa GET para verificar el webhook al configurarlo

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateReply, transcribeAudio, describeImage } from "@/lib/ai"
import { sendWhatsAppMessage, sendWhatsAppMedia, uploadMedia, markAsRead, downloadMedia } from "@/lib/whatsapp"
import { getPropertyData, findImageUrl } from "@/lib/sheets"

// Número del dueño — recibe notificaciones de compras y aprueba pagos
const OWNER_PHONE = process.env.OWNER_PHONE ?? ""

// Cliente con service role — bypasa RLS, solo usar en el servidor
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── GET: Verificación del webhook (Meta lo llama 1 sola vez al configurar) ──
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ Webhook de WhatsApp verificado")
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Token inválido" }, { status: 403 })
}

// ── POST: Recibe mensajes nuevos de WhatsApp ──
export async function POST(request: NextRequest) {
  const body = await request.json()

  const value    = body?.entry?.[0]?.changes?.[0]?.value
  const messages = value?.messages

  if (!messages || messages.length === 0) {
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const message          = messages[0]
  const from             = message.from
  const whatsappMsgId    = message.id
  const phoneNumberId    = value?.metadata?.phone_number_id
  const contactName: string | null = value?.contacts?.[0]?.profile?.name ?? null

  const supported = ["text", "audio", "voice", "image"]
  if (!supported.includes(message.type)) {
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const supabase = createServiceClient()

  // ── DEDUPLICACIÓN ──
  const { data: duplicate } = await supabase
    .from("messages")
    .select("id")
    .eq("whatsapp_message_id", whatsappMsgId)
    .maybeSingle()

  if (duplicate) {
    console.log(`⏭️ Mensaje duplicado ignorado: ${whatsappMsgId}`)
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  // ── PASO 1: Tenant ──
  const { data: whatsappConfig } = await supabase
    .from("whatsapp_configs")
    .select("tenant_id, access_token, phone_number_id")
    .eq("phone_number_id", phoneNumberId)
    .single()

  if (!whatsappConfig) {
    console.error(`❌ No se encontró tenant para phone_number_id: ${phoneNumberId}`)
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const tenantId = whatsappConfig.tenant_id

  // ── PASO 2: Procesar el contenido del mensaje ──
  let textForAI  = message.text?.body ?? ""
  let textForDB  = textForAI
  let messageType = "text"
  let inboundMediaId: string | null = null
  // Buffer de la imagen entrante (para reenviar al dueño si es voucher)
  let inboundImageBuffer: Buffer | null   = null
  let inboundImageMime:   string | null   = null

  const isAudio = message.type === "audio" || message.type === "voice"
  const audioId = message.audio?.id ?? message.voice?.id

  if (isAudio && audioId) {
    inboundMediaId = audioId
    messageType    = "audio"

    const media = await downloadMedia({ mediaId: audioId, accessToken: whatsappConfig.access_token! })
    if (!media) {
      textForAI = "El usuario envió una nota de voz (no se pudo transcribir)"
      textForDB = "🎤 Nota de voz"
    } else {
      const transcription = await transcribeAudio(media.buffer, media.mimeType)
      textForAI = transcription || "El usuario envió una nota de voz (no se pudo transcribir)"
      textForDB = "🎤 Nota de voz"
      if (transcription) console.log(`🎤 Audio transcrito de ${from}: "${transcription}"`)
    }
  }

  if (message.type === "image" && message.image?.id) {
    inboundMediaId = message.image.id
    messageType    = "image"

    const media = await downloadMedia({ mediaId: message.image.id, accessToken: whatsappConfig.access_token! })
    if (!media) {
      textForAI = "El usuario envió una imagen (no se pudo procesar)"
      textForDB = "🖼️ Imagen"
    } else {
      inboundImageBuffer = media.buffer
      inboundImageMime   = media.mimeType
      const description  = await describeImage(media.buffer, media.mimeType)
      textForAI = description
        ? `El usuario envió una imagen. Descripción: ${description}`
        : "El usuario envió una imagen"
      textForDB = "🖼️ Imagen"
      console.log(`🖼️ Imagen recibida de ${from}: "${description}"`)
    }
  }

  if (!textForAI) {
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  // ── PASO 3: Contacto ──
  const { data: contact } = await supabase
    .from("contacts")
    .upsert(
      {
        tenant_id:       tenantId,
        phone:           from,
        last_message_at: new Date().toISOString(),
        ...(contactName ? { name: contactName } : {}),
      },
      { onConflict: "tenant_id,phone" }
    )
    .select("id")
    .single()

  if (!contact) {
    console.error("❌ Error al crear/actualizar contacto")
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  // ── PASO 4: Conversación ──
  const { data: existingConversation, error: convError } = await supabase
    .from("conversations")
    .select("id, ai_paused")
    .eq("tenant_id", tenantId)
    .eq("contact_id", contact.id)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (convError) console.error("❌ Error buscando conversación:", convError.message)

  let conversationId: string
  let aiPaused         = false
  let awaitingApproval = false

  if (existingConversation) {
    conversationId = existingConversation.id
    aiPaused       = existingConversation.ai_paused ?? false

    // awaiting_approval en query separada (requiere migración DB)
    const { data: convExtra } = await supabase
      .from("conversations")
      .select("awaiting_approval")
      .eq("id", conversationId)
      .maybeSingle()
    awaitingApproval = convExtra?.awaiting_approval ?? false
  } else {
    const { data: newConversation } = await supabase
      .from("conversations")
      .insert({ tenant_id: tenantId, contact_id: contact.id })
      .select("id")
      .single()

    if (!newConversation) {
      console.error("❌ Error al crear conversación")
      return NextResponse.json({ status: "ok" }, { status: 200 })
    }

    conversationId = newConversation.id
  }

  // ── PASO 5: Guardar mensaje entrante ──
  await supabase.from("messages").insert({
    conversation_id:     conversationId,
    content:             textForDB,
    direction:           "inbound",
    sent_by_ai:          false,
    whatsapp_message_id: whatsappMsgId,
    message_type:        messageType,
    ...(inboundMediaId ? { media_id: inboundMediaId } : {}),
  })

  console.log(`📩 Mensaje guardado de ${from}: "${textForDB}"`)

  // ── PASO 6: Marcar como leído ──
  await markAsRead({
    messageId:     whatsappMsgId,
    phoneNumberId: whatsappConfig.phone_number_id!,
    accessToken:   whatsappConfig.access_token!,
  })

  // ── HELPER: enviar imagen a un número (descarga → sube → envía) ──
  const sendImageToPhone = async (buffer: Buffer, mimeType: string, to: string) => {
    const ext     = mimeType.split("/")[1]?.split(";")[0] ?? "jpg"
    const mediaId = await uploadMedia({
      buffer,
      mimeType,
      filename:      `imagen.${ext}`,
      phoneNumberId: whatsappConfig.phone_number_id!,
      accessToken:   whatsappConfig.access_token!,
    })
    if (!mediaId) throw new Error("uploadMedia devolvió null")
    await sendWhatsAppMedia({
      to,
      mediaId,
      type:          "image",
      phoneNumberId: whatsappConfig.phone_number_id!,
      accessToken:   whatsappConfig.access_token!,
    })
  }

  // ── HELPER: enviar imagen desde URL del Sheet ──
  const sendImageFromUrl = async (imageUrl: string, to: string) => {
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) throw new Error(`No se pudo descargar imagen: ${imgRes.status}`)
    const mimeType = imgRes.headers.get("content-type") ?? "image/jpeg"
    const buffer   = Buffer.from(await imgRes.arrayBuffer())
    await sendImageToPhone(buffer, mimeType, to)
  }

  // ── PASO 7: Manejar mensajes del DUEÑO ──
  // Si el mensaje viene del dueño, procesar confirmación/rechazo de pagos
  if (OWNER_PHONE && from === OWNER_PHONE) {
    const text       = textForAI.toLowerCase().trim()
    const isConfirm  = text.includes("confirmar") || text === "si" || text === "sí" || text === "ok" || text === "aprobado"
    const isReject   = text.includes("rechazar") || text === "no" || text.includes("cancelar")

    if (isConfirm || isReject) {
      // Buscar conversación de cliente esperando aprobación
      const { data: pendingConvs } = await supabase
        .from("conversations")
        .select("id, contact_id, approval_client_info")
        .eq("tenant_id", tenantId)
        .eq("awaiting_approval", true)
        .order("updated_at", { ascending: false })
        .limit(1)

      const pending = pendingConvs?.[0]

      if (pending) {
        const { data: clientContact } = await supabase
          .from("contacts")
          .select("phone")
          .eq("id", pending.contact_id)
          .single()

        if (clientContact) {
          const clientMsg = isConfirm
            ? "¡Tu pago fue confirmado exitosamente! ✅ Tu pedido está en proceso. ¡Gracias por tu compra! 🎉"
            : "Lo sentimos, no pudimos verificar tu pago. 😕 Por favor contáctanos para más información o intenta nuevamente."

          await sendWhatsAppMessage({
            to:            clientContact.phone,
            message:       clientMsg,
            phoneNumberId: whatsappConfig.phone_number_id!,
            accessToken:   whatsappConfig.access_token!,
          })

          await supabase.from("conversations")
            .update({ awaiting_approval: false, approval_client_info: null })
            .eq("id", pending.id)

          const ownerAck = isConfirm
            ? `✅ Pago confirmado. Cliente notificado.`
            : `❌ Pago rechazado. Cliente notificado.`

          await sendWhatsAppMessage({
            to:            OWNER_PHONE,
            message:       ownerAck,
            phoneNumberId: whatsappConfig.phone_number_id!,
            accessToken:   whatsappConfig.access_token!,
          })

          console.log(`✅ Confirmación del dueño procesada: ${isConfirm ? "APROBADO" : "RECHAZADO"} → ${clientContact.phone}`)
        }
      } else {
        await sendWhatsAppMessage({
          to:            OWNER_PHONE,
          message:       "No hay pagos pendientes de confirmación.",
          phoneNumberId: whatsappConfig.phone_number_id!,
          accessToken:   whatsappConfig.access_token!,
        })
      }
    }

    // No generar respuesta IA para mensajes del dueño
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  // ── PASO 8: Respuesta automática con IA ──
  const { data: aiConfig } = await supabase
    .from("ai_configs")
    .select("enabled, system_prompt")
    .eq("tenant_id", tenantId)
    .single()

  console.log(`🔧 AI config: enabled=${aiConfig?.enabled}, aiPaused=${aiPaused}`)

  if (!aiConfig?.enabled || aiPaused) {
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  // Historial de conversación
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("content, direction")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(10)

  const history = (recentMessages ?? [])
    .reverse()
    .slice(0, -1)
    .map(msg => ({
      role:    msg.direction === "inbound" ? "user" as const : "assistant" as const,
      content: msg.content,
    }))

  // Datos del Sheet
  const sheetData    = await getPropertyData()
  const systemPrompt = sheetData.text
    ? `${aiConfig.system_prompt}\n\n## Inventario de productos:\n${sheetData.text}`
    : aiConfig.system_prompt

  // Helper fallback
  const sendFallback = async () => {
    const fallback = "En este momento tuve un inconveniente para responder. Vuelvo enseguida. 🙏"
    try {
      await sendWhatsAppMessage({
        to: from, message: fallback,
        phoneNumberId: whatsappConfig.phone_number_id!,
        accessToken:   whatsappConfig.access_token!,
      })
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        content:         fallback,
        direction:       "outbound",
        sent_by_ai:      true,
      })
    } catch (err) {
      console.error("❌ Error enviando fallback:", err)
    }
  }

  // Generar respuesta
  let aiReply: Awaited<ReturnType<typeof generateReply>>
  try {
    aiReply = await generateReply({ userMessage: textForAI, systemPrompt, conversationHistory: history })
    console.log(`🤖 generateReply → reply="${aiReply.reply.substring(0, 100)}", product="${aiReply.productName}", purchase=${aiReply.purchaseDetected}`)
  } catch (err) {
    console.error("❌ Error generando respuesta con IA:", err)
    await sendFallback()
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const { reply, productName, purchaseDetected, clientSummary } = aiReply

  // ── Enviar imagen del producto si el AI lo indicó ──
  if (productName) {
    const imageUrl = findImageUrl(productName, sheetData.imageMap)
    if (imageUrl) {
      try {
        await sendImageFromUrl(imageUrl, from)
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          content:         `🖼️ Imagen de ${productName}`,
          direction:       "outbound",
          sent_by_ai:      true,
          message_type:    "image",
        })
        console.log(`🖼️ Imagen de "${productName}" enviada a ${from}`)
      } catch (err) {
        console.error(`❌ Error enviando imagen de "${productName}":`, err)
      }
    } else {
      console.warn(`⚠️ No se encontró imagen para producto: "${productName}"`)
    }
  }

  // ── Enviar texto de respuesta ──
  if (reply) {
    try {
      const sent = await sendWhatsAppMessage({
        to: from, message: reply,
        phoneNumberId: whatsappConfig.phone_number_id!,
        accessToken:   whatsappConfig.access_token!,
      })
      await supabase.from("messages").insert({
        conversation_id:     conversationId,
        content:             reply,
        direction:           "outbound",
        sent_by_ai:          true,
        whatsapp_message_id: sent?.messages?.[0]?.id ?? null,
      })
      console.log(`🤖 Respuesta enviada a ${from}: "${reply}"`)
    } catch (err) {
      console.error("❌ Error enviando texto:", err)
      await sendFallback()
    }
  } else if (!productName) {
    // No hubo imagen ni texto — enviar fallback
    await sendFallback()
  }

  // ── Notificar al dueño si se detectó una compra ──
  if (purchaseDetected && OWNER_PHONE) {
    try {
      const clientDisplayName = contactName || from
      const summary = clientSummary || `Cliente: ${clientDisplayName}\nTeléfono: ${from}`

      const ownerMsg =
        `🛒 *Nueva compra detectada*\n\n` +
        `${summary}\n\n` +
        `📱 WhatsApp del cliente: +${from}\n\n` +
        `_Responde *CONFIRMAR* o *RECHAZAR* para notificar al cliente._`

      await sendWhatsAppMessage({
        to:            OWNER_PHONE,
        message:       ownerMsg,
        phoneNumberId: whatsappConfig.phone_number_id!,
        accessToken:   whatsappConfig.access_token!,
      })

      // Si el cliente envió un voucher (imagen), reenviarlo al dueño
      if (inboundImageBuffer && inboundImageMime) {
        await sendImageToPhone(inboundImageBuffer, inboundImageMime, OWNER_PHONE)
        console.log(`📤 Voucher del cliente reenviado al dueño`)
      }

      // Marcar conversación como esperando aprobación
      await supabase.from("conversations")
        .update({ awaiting_approval: true, approval_client_info: summary })
        .eq("id", conversationId)

      // Avisarle al cliente que estamos verificando
      const verifyMsg = "Estamos verificando tu pago. En breve te confirmamos. ✅"
      await sendWhatsAppMessage({
        to:            from,
        message:       verifyMsg,
        phoneNumberId: whatsappConfig.phone_number_id!,
        accessToken:   whatsappConfig.access_token!,
      })
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        content:         verifyMsg,
        direction:       "outbound",
        sent_by_ai:      true,
      })

      console.log(`💰 Compra detectada — dueño notificado (${OWNER_PHONE})`)
    } catch (err) {
      console.error("❌ Error notificando al dueño:", err)
    }
  }

  return NextResponse.json({ status: "ok" }, { status: 200 })
}
