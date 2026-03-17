// API Route: /api/webhook/whatsapp
// Meta envía los mensajes de WhatsApp a esta URL (POST)
// También usa GET para verificar el webhook al configurarlo

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateReply, transcribeAudio, describeImage } from "@/lib/ai"
import { sendWhatsAppMessage, sendWhatsAppMedia, sendWhatsAppLocation, uploadMedia, markAsRead, downloadMedia } from "@/lib/whatsapp"
import { getPropertyData, findImageUrl } from "@/lib/sheets"

// Deduplicación en memoria — evita reprocesar si Meta reenvía el webhook
const recentlyProcessed = new Set<string>()
function isAlreadyProcessed(msgId: string): boolean {
  if (recentlyProcessed.has(msgId)) return true
  recentlyProcessed.add(msgId)
  // Limpiar después de 10 minutos
  setTimeout(() => recentlyProcessed.delete(msgId), 10 * 60 * 1000)
  return false
}

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

  // ── DEDUPLICACIÓN EN MEMORIA (primer filtro — evita reintentos de Meta) ──
  if (isAlreadyProcessed(whatsappMsgId)) {
    console.log(`⏭️ Mensaje ya procesado (memoria): ${whatsappMsgId}`)
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const supabase = createServiceClient()

  // ── DEDUPLICACIÓN EN DB (segundo filtro — por si el servidor reinició) ──
  const { data: duplicate } = await supabase
    .from("messages")
    .select("id")
    .eq("whatsapp_message_id", whatsappMsgId)
    .maybeSingle()

  if (duplicate) {
    console.log(`⏭️ Mensaje duplicado ignorado (DB): ${whatsappMsgId}`)
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

  // Cargar config del catálogo del tenant
  const { data: catalogConfig } = await supabase
    .from("catalog_configs")
    .select("sheet_id, sheet_gid, enabled")
    .eq("tenant_id", tenantId)
    .maybeSingle()

  // ── PASO 2: Procesar el contenido del mensaje ──
  let textForAI  = message.text?.body ?? ""
  let textForDB  = textForAI
  let messageType = "text"
  let inboundMediaId: string | null = null

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
      const description = await describeImage(media.buffer, media.mimeType)
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

  // ── PASO 7: Respuesta automática con IA ──
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

  // ══ FUENTES DE CONOCIMIENTO DEL AGENTE ══
  // Tres fuentes en paralelo para máxima velocidad

  const [sheetResult, rentiaResult, docsResult] = await Promise.all([

    // 1. Google Sheets (si está conectado y habilitado)
    catalogConfig?.sheet_id && catalogConfig?.enabled !== false
      ? getPropertyData(catalogConfig.sheet_id, catalogConfig.sheet_gid)
      : Promise.resolve({ text: "", imageMap: {} }),

    // 2. Catálogo RentIA (productos creados en la app)
    supabase
      .from("catalog_products")
      .select("name, description, price, currency, image_url")
      .eq("tenant_id", tenantId)
      .eq("enabled", true),

    // 3. Documentos subidos por el usuario
    supabase
      .from("knowledge_documents")
      .select("name, content")
      .eq("tenant_id", tenantId)
      .eq("enabled", true),
  ])

  const sheetData      = sheetResult
  const rentiaProducts = rentiaResult.data ?? []
  const knowledgeDocs  = docsResult.data ?? []

  // Formatear catálogo RentIA como texto
  const rentiaCatalogText = rentiaProducts.length > 0
    ? rentiaProducts.map(p => {
        const price = p.price != null ? ` — ${p.currency} ${p.price}` : ""
        const desc  = p.description ? ` — ${p.description}` : ""
        const foto  = p.image_url ? " [tiene foto disponible]" : ""
        return `• ${p.name}${desc}${price}${foto}`
      }).join("\n")
    : ""

  // Mapa de imágenes RentIA para envío automático por WhatsApp
  const rentiaCatalogImageMap: Record<string, string> = {}
  for (const p of rentiaProducts) {
    if (p.image_url) rentiaCatalogImageMap[p.name.toLowerCase()] = p.image_url
  }

  // Formatear documentos
  const docsText = knowledgeDocs
    .map(doc => `## ${doc.name}:\n${doc.content}`)
    .join("\n\n")

  // Ensamblar contexto final
  const knowledgeParts: string[] = []
  if (rentiaCatalogText) knowledgeParts.push(`## Catálogo de productos:\n${rentiaCatalogText}`)
  if (sheetData.text)    knowledgeParts.push(`## Inventario (Spreadsheet):\n${sheetData.text}`)
  if (docsText)          knowledgeParts.push(docsText)

  const knowledgeContext = knowledgeParts.join("\n\n")

  const basePrompt = knowledgeContext
    ? `${aiConfig.system_prompt}\n\n${knowledgeContext}`
    : aiConfig.system_prompt

  const systemPrompt = history.length > 0
    ? `${basePrompt}\n\nIMPORTANTE: Ya has interactuado con este cliente antes. NO vuelvas a saludarlo. Continúa la conversación de forma natural.`
    : basePrompt

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
    console.log(`🤖 generateReply → reply="${aiReply.reply.substring(0, 100)}", product="${aiReply.productName}"`)
  } catch (err) {
    console.error("❌ Error generando respuesta con IA:", err)
    await sendFallback()
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const { reply, productName, sendLocation, handover, leadNotes } = aiReply

  // ── Guardar notas del lead si la IA detectó información relevante ──
  if (leadNotes) {
    const timestamp = new Date().toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })
    const newNote   = `[${timestamp}] ${leadNotes}`

    const { data: currentContact } = await supabase
      .from("contacts").select("notes").eq("id", contact.id).single()

    const updatedNotes = currentContact?.notes
      ? `${currentContact.notes}\n${newNote}`
      : newNote

    await supabase.from("contacts").update({ notes: updatedNotes }).eq("id", contact.id)
    console.log(`📝 Nota guardada para ${from}: "${leadNotes}"`)
  }

  // ── Handover: pausar IA y transferir a humano ──
  if (handover) {
    await supabase.from("conversations").update({ ai_paused: true }).eq("id", conversationId)
    console.log(`🤝 Handover activado para conversación ${conversationId} — IA pausada`)
  }

  // ── Enviar ubicación de la tienda si el AI lo indicó ──
  if (sendLocation) {
    const lat     = parseFloat(process.env.STORE_LATITUDE  ?? "0")
    const lng     = parseFloat(process.env.STORE_LONGITUDE ?? "0")
    const name    = process.env.STORE_NAME    ?? "Nuestra tienda"
    const address = process.env.STORE_ADDRESS ?? ""

    if (lat && lng) {
      try {
        const sentLoc = await sendWhatsAppLocation({
          to:            from,
          latitude:      lat,
          longitude:     lng,
          name,
          address,
          phoneNumberId: whatsappConfig.phone_number_id!,
          accessToken:   whatsappConfig.access_token!,
        })
        await supabase.from("messages").insert({
          conversation_id:     conversationId,
          content:             `📍 ${name}${address ? ` — ${address}` : ""}`,
          direction:           "outbound",
          sent_by_ai:          true,
          message_type:        "location",
          whatsapp_message_id: sentLoc?.messages?.[0]?.id ?? null,
        })
        console.log(`📍 Ubicación enviada a ${from}: ${name}`)
      } catch (err) {
        console.error("❌ Error enviando ubicación:", err)
      }
    } else {
      console.warn("⚠️ STORE_LATITUDE/STORE_LONGITUDE no configurados — no se envió ubicación")
    }
  }

  // ── Enviar imagen del producto si el AI lo indicó ──
  // Busca en: 1) Catálogo RentIA  2) Google Sheets
  if (productName) {
    const imageUrl =
      findImageUrl(productName, rentiaCatalogImageMap) ??
      findImageUrl(productName, sheetData.imageMap)
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
  } else if (!productName && !sendLocation && !handover) {
    // No hubo imagen, ubicación, handover ni texto — enviar fallback
    await sendFallback()
  }

  return NextResponse.json({ status: "ok" }, { status: 200 })
}
