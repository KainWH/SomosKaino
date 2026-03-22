// API Route: /api/webhook/whatsapp
// Meta envía los mensajes de WhatsApp a esta URL (POST)
// También usa GET para verificar el webhook al configurarlo

import { NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { createClient } from "@supabase/supabase-js"
import { generateReply, transcribeAudio, describeImage } from "@/lib/ai"
import { sendWhatsAppMessage, sendWhatsAppMedia, sendWhatsAppLocation, sendWhatsAppImageByUrl, uploadMedia, markAsRead, downloadMedia, sendWhatsAppTemplate } from "@/lib/whatsapp"
import { getPropertyData, findImageUrl } from "@/lib/sheets"
import { validateWebhookSignature } from "@/lib/whatsapp-utils"

// Deduplicación en memoria — evita reprocesar si Meta reenvía el webhook
const recentlyProcessed = new Set<string>()
function isAlreadyProcessed(msgId: string): boolean {
  if (recentlyProcessed.has(msgId)) return true
  recentlyProcessed.add(msgId)
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

// ── GET: Verificación del webhook ────────────────────────────────────────────
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

// ── POST: Recibe mensajes nuevos de WhatsApp ─────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Leer body RAW (necesario antes de parsear para validar firma)
  const rawBody = await request.text()

  // 2. Validar firma de Meta — solo si META_APP_SECRET está configurado
  const signature = request.headers.get("x-hub-signature-256")
  if (process.env.META_APP_SECRET) {
    if (!validateWebhookSignature(rawBody, signature)) {
      console.warn("⚠️ Webhook rechazado: firma inválida")
      return new NextResponse("Unauthorized", { status: 401 })
    }
  } else {
    console.warn("⚠️ META_APP_SECRET no configurado — validación de firma desactivada")
  }

  // 3. Parsear JSON
  const body = JSON.parse(rawBody)

  const value    = body?.entry?.[0]?.changes?.[0]?.value
  const messages = value?.messages

  if (!messages || messages.length === 0) {
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const message       = messages[0]
  const whatsappMsgId = message.id

  const supported = ["text", "audio", "voice", "image"]
  if (!supported.includes(message.type)) {
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  // 4. Deduplicación en memoria (rápido — antes de tocar la DB)
  if (isAlreadyProcessed(whatsappMsgId)) {
    console.log(`⏭️ Mensaje ya procesado (memoria): ${whatsappMsgId}`)
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  // 5. Responder 200 INMEDIATAMENTE y procesar de forma asíncrona
  //    waitUntil garantiza que Vercel no mata la función hasta que termine el procesamiento
  waitUntil(processWebhookMessage(body))

  return NextResponse.json({ status: "ok" }, { status: 200 })
}

// ── Procesamiento asíncrono del mensaje ─────────────────────────────────────
async function processWebhookMessage(body: any) {
  const value    = body?.entry?.[0]?.changes?.[0]?.value
  const messages = value?.messages
  if (!messages?.length) return

  const message          = messages[0]
  const from             = message.from
  const whatsappMsgId    = message.id
  const phoneNumberId    = value?.metadata?.phone_number_id
  const contactName: string | null = value?.contacts?.[0]?.profile?.name ?? null
  const referral         = message.referral ?? null
  if (referral) console.log(`📣 Referral: headline="${referral.headline}", platform source detected`)

  const supabase = createServiceClient()

  // Deduplicación en DB (por si el servidor reinició)
  const { data: duplicate } = await supabase
    .from("messages")
    .select("id")
    .eq("whatsapp_message_id", whatsappMsgId)
    .maybeSingle()

  if (duplicate) {
    console.log(`⏭️ Mensaje duplicado ignorado (DB): ${whatsappMsgId}`)
    return
  }

  // ── Tenant ───────────────────────────────────────────────────────────────
  const { data: whatsappConfig } = await supabase
    .from("whatsapp_configs")
    .select("tenant_id, access_token, phone_number_id")
    .eq("phone_number_id", phoneNumberId)
    .single()

  if (!whatsappConfig) {
    console.error(`❌ No se encontró tenant para phone_number_id: ${phoneNumberId}`)
    return
  }

  const tenantId = whatsappConfig.tenant_id

  const { data: tenantData } = await supabase
    .from("tenants")
    .select("company, name, store_address, store_latitude, store_longitude")
    .eq("id", tenantId)
    .single()

  const companyName  = tenantData?.company || tenantData?.name || null
  const storeAddress = tenantData?.store_address || process.env.STORE_ADDRESS || ""
  const storeLat     = tenantData?.store_latitude  ? Number(tenantData.store_latitude)  : parseFloat(process.env.STORE_LATITUDE  ?? "0")
  const storeLng     = tenantData?.store_longitude ? Number(tenantData.store_longitude) : parseFloat(process.env.STORE_LONGITUDE ?? "0")

  const { data: catalogConfig } = await supabase
    .from("catalog_configs")
    .select("sheet_id, sheet_gid, enabled")
    .eq("tenant_id", tenantId)
    .maybeSingle()

  // ── Procesar contenido del mensaje ───────────────────────────────────────
  let textForAI   = message.text?.body ?? ""
  let textForDB   = textForAI
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

  if (!textForAI) return

  // ── Contacto (upsert con opt-in) ─────────────────────────────────────────
  const optInSource = referral?.source_id ? "ctwa_ad" : "direct_message"
  const { data: contact } = await supabase
    .from("contacts")
    .upsert(
      {
        tenant_id:       tenantId,
        phone:           from,
        last_message_at: new Date().toISOString(),
        opted_in_at:     new Date().toISOString(),
        opt_in_source:   optInSource,
        ...(referral?.ctwa_clid ? { ctwa_clid: referral.ctwa_clid } : {}),
        ...(contactName ? { name: contactName } : {}),
      },
      { onConflict: "tenant_id,phone" }
    )
    .select("id")
    .single()

  if (!contact) {
    console.error("❌ Error al crear/actualizar contacto")
    return
  }

  // ── Conversación ─────────────────────────────────────────────────────────
  const { data: existingConversation, error: convError } = await supabase
    .from("conversations")
    .select("id, ai_paused, awaiting_approval")
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
  let isNewConversation = false

  if (existingConversation) {
    conversationId   = existingConversation.id
    aiPaused         = existingConversation.ai_paused ?? false
    awaitingApproval = existingConversation.awaiting_approval ?? false

    // Actualizar ventana de 24h
    await supabase
      .from("conversations")
      .update({ last_user_message_at: new Date().toISOString() })
      .eq("id", conversationId)
  } else {
    const { data: newConversation } = await supabase
      .from("conversations")
      .insert({
        tenant_id:            tenantId,
        contact_id:           contact.id,
        last_user_message_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (!newConversation) {
      console.error("❌ Error al crear conversación")
      return
    }

    conversationId    = newConversation.id
    isNewConversation = true
  }

  // Si el cliente llegó desde un anuncio, guardar nota + banner en el chat
  // Se aplica tanto a conversaciones nuevas como existentes (pero solo una vez por conversación)
  if (referral?.headline) {
    const sourceUrl  = referral.source_url ?? ""
    const platform   = sourceUrl.includes("instagram") ? "Instagram"
                     : sourceUrl.includes("facebook")  ? "Facebook"
                     : "Meta Ads"

    const adProduct = referral.body && referral.body !== referral.headline ? ` — Producto: "${referral.body}"` : ""
    const adNote = `[Origen: Anuncio "${referral.headline}"${adProduct} vía ${platform}${referral.source_id ? ` (ID: ${referral.source_id})` : ""}]`
    const { data: currentContact } = await supabase
      .from("contacts").select("notes").eq("id", contact.id).single()
    const updatedNotes = currentContact?.notes
      ? `${currentContact.notes}\n${adNote}`
      : adNote
    await supabase.from("contacts").update({ notes: updatedNotes }).eq("id", contact.id)
    console.log(`📣 Cliente de anuncio "${referral.headline}" vía ${platform} — nota guardada para ${from}`)

    // Insertar banner solo si no existe ya uno en esta conversación
    const { data: existingBanner } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("message_type", "referral")
      .limit(1)
      .maybeSingle()

    if (!existingBanner) {
      const chatMessages: object[] = [
        {
          conversation_id: conversationId,
          content:         JSON.stringify({
            headline:  referral.headline,
            body:      referral.body ?? null,
            platform,
            image_url: referral.image_url ?? null,
          }),
          direction:       "inbound",
          sent_by_ai:      false,
          message_type:    "referral",
        },
      ]
      if (referral.image_url) {
        chatMessages.push({
          conversation_id: conversationId,
          content:         referral.image_url,
          direction:       "inbound",
          sent_by_ai:      false,
          message_type:    "image",
        })
      }
      await supabase.from("messages").insert(chatMessages)
      console.log(`📣 Banner de anuncio "${referral.headline}" guardado en el chat para ${from}`)
    } else {
      console.log(`📣 Banner de anuncio ya existente para conversación ${conversationId} — omitido`)
    }
  }

  // ── Guardar mensaje entrante ──────────────────────────────────────────────
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

  // ── Marcar como leído ─────────────────────────────────────────────────────
  await markAsRead({
    messageId:     whatsappMsgId,
    phoneNumberId: whatsappConfig.phone_number_id!,
    accessToken:   whatsappConfig.access_token!,
  })

  // ── Respuesta automática con IA ───────────────────────────────────────────
  const { data: aiConfig } = await supabase
    .from("ai_configs")
    .select("enabled, system_prompt")
    .eq("tenant_id", tenantId)
    .single()

  console.log(`🔧 AI config: enabled=${aiConfig?.enabled}, aiPaused=${aiPaused}`)

  if (!aiConfig?.enabled || aiPaused) return

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

  // Fuentes de conocimiento + notas del contacto (incluye origen del anuncio)
  const [sheetResult, kainoResult, docsResult, contactResult] = await Promise.all([
    catalogConfig?.sheet_id && catalogConfig?.enabled !== false
      ? getPropertyData(catalogConfig.sheet_id, catalogConfig.sheet_gid)
      : Promise.resolve({ text: "", imageMap: {} }),
    supabase
      .from("catalog_products")
      .select("name, description, price, currency, image_url")
      .eq("tenant_id", tenantId)
      .eq("enabled", true),
    supabase
      .from("knowledge_documents")
      .select("name, content")
      .eq("tenant_id", tenantId)
      .eq("enabled", true),
    supabase
      .from("contacts")
      .select("notes")
      .eq("id", contact.id)
      .single(),
  ])

  const sheetData     = sheetResult
  const kainoProducts = kainoResult.data ?? []
  const knowledgeDocs = docsResult.data ?? []
  const contactNotes  = contactResult.data?.notes ?? null

  const kainoCatalogText = kainoProducts.length > 0
    ? kainoProducts.map(p => {
        const price = p.price != null ? ` — ${p.currency} ${p.price}` : ""
        const desc  = p.description ? ` — ${p.description}` : ""
        const foto  = p.image_url ? " [tiene foto disponible]" : ""
        return `• ${p.name}${desc}${price}${foto}`
      }).join("\n")
    : ""

  const kainoCatalogImageMap: Record<string, string> = {}
  for (const p of kainoProducts) {
    if (p.image_url) kainoCatalogImageMap[p.name.toLowerCase()] = p.image_url
  }

  const docsText = knowledgeDocs
    .map(doc => `## ${doc.name}:\n${doc.content}`)
    .join("\n\n")

  const knowledgeParts: string[] = []
  if (kainoCatalogText) knowledgeParts.push(`## Catálogo de productos:\n${kainoCatalogText}`)
  if (sheetData.text)   knowledgeParts.push(`## Inventario (Spreadsheet):\n${sheetData.text}`)
  if (docsText)         knowledgeParts.push(docsText)

  const knowledgeContext = knowledgeParts.join("\n\n")
  const basePrompt = knowledgeContext
    ? `${aiConfig.system_prompt}\n\n${knowledgeContext}`
    : aiConfig.system_prompt

  // Contexto del anuncio: usamos headline + body para identificar el producto.
  // El body suele tener el nombre del producto cuando el headline es genérico (ej: nombre de la tienda).
  const adHeadline = (referral?.body || referral?.headline)
    ?? contactNotes?.match(/\[Origen: Anuncio "([^"]+)"/)?.[1]
    ?? null

  // Si es conversación nueva y el cliente solo saludó, el greeting hardcodeado ya fue suficiente
  const isGreetingOnly = /^(hola|hello|hi|hey|buenas?|buenos?\s*(d[ií]as?|tardes?|noches?)|good\s*(morning|afternoon|evening|day)|saludos?|greetings?|que\s*tal|what'?s?\s*up)[\s!.¡¿?😊👋]*$/i.test(textForAI.trim())
  if (isNewConversation && isGreetingOnly && !adHeadline) {
    console.log(`👋 Primer mensaje es saludo puro — greeting hardcodeado ya enviado, sin respuesta AI`)
    return
  }

  const adPlatform = referral
    ? ((referral.source_url ?? "").includes("instagram") ? "Instagram"
      : (referral.source_url ?? "").includes("facebook") ? "Facebook"
      : "Meta Ads")
    : contactNotes?.match(/\[Origen: Anuncio "[^"]+" vía ([^\s(]+)/)?.[1]
    ?? "Meta Ads"

  // Buscar el producto del anuncio en el catálogo para dar contexto completo al AI
  const adProduct = adHeadline
    ? kainoProducts.find(p =>
        p.name.toLowerCase().includes(adHeadline.toLowerCase()) ||
        adHeadline.toLowerCase().includes(p.name.toLowerCase())
      )
    : null

  const adProductInfo = adProduct
    ? `Detalles del producto: ${adProduct.name}${adProduct.description ? ` — ${adProduct.description}` : ""}${adProduct.price != null ? ` — Precio: ${adProduct.currency} ${adProduct.price}` : ""}${adProduct.image_url ? " [tiene foto disponible]" : ""}.`
    : ""

  const referralContext = adHeadline
    ? adProduct
      ? `\n\nCONTEXTO CRÍTICO — ANUNCIO DE PAGO: Este cliente llegó desde un anuncio de ${adPlatform} sobre "${adHeadline}". ${adProductInfo} REGLAS ESTRICTAS: (1) NUNCA saludes — el saludo ya fue enviado automáticamente, NO digas Hola ni Saludos. (2) NUNCA preguntes a qué producto se refiere — ya lo sabes. (3) ${isNewConversation ? `Tu primer mensaje debe confirmar directamente que SÍ tenemos el producto y preguntar cuántas unidades quiere. Ej: "Sí, tenemos el ${adProduct!.name} a ${adProduct!.currency} ${adProduct!.price}. ¿Cuántas unidades necesitas?"` : `Continúa la conversación sobre "${adHeadline}" de forma breve.`} (4) Si preguntan precio/detalles/stock sin especificar producto, siempre es sobre "${adHeadline}". (5) NUNCA listes especificaciones técnicas a menos que las pidan.`
      : `\n\nCONTEXTO CRÍTICO — ANUNCIO DE PAGO: Este cliente llegó desde un anuncio de ${adPlatform} sobre "${adHeadline}". REGLAS ESTRICTAS: (1) NUNCA saludes — el saludo ya fue enviado automáticamente, NO digas Hola ni Saludos. (2) NUNCA preguntes a qué producto se refiere — el cliente ya lo sabe por el anuncio. (3) ${isNewConversation ? "Tu primer mensaje debe mostrar directamente los productos disponibles que puedan ser similares o relacionados con lo que vio en el anuncio." : `Continúa la conversación sobre el anuncio de forma breve.`}`
    : ""

  const companyContext = companyName
    ? `\n\nNOMBRE DE LA EMPRESA: Eres el asistente virtual de "${companyName}". Si el cliente envía un saludo (Hola, Hello, Hi, Buenos días, Buenas, etc.), responde SIEMPRE con exactamente: "Saludos, gracias por comunicarte con ${companyName}, ¿cómo puedo asistirte?" — sin agregar nada más en ese mensaje.`
    : ""

  const systemPrompt = history.length > 0 || isNewConversation
    ? `${basePrompt}${companyContext}${referralContext}\n\nIMPORTANTE: El saludo inicial ya fue enviado automáticamente. NO vuelvas a saludar. Continúa la conversación de forma natural.`
    : `${basePrompt}${companyContext}${referralContext}`

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
        content: fallback, direction: "outbound", sent_by_ai: true,
      })
    } catch (err) {
      console.error("❌ Error enviando fallback:", err)
    }
  }

  // Generar respuesta con Gemini
  // Enviar saludo fijo en conversaciones nuevas
  if (isNewConversation) {
    const greeting = `Saludos, te comunicas con la tienda ${companyName ?? "Techjol"} 👋`
    try {
      const sentGreeting = await sendWhatsAppMessage({
        to: from, message: greeting,
        phoneNumberId: whatsappConfig.phone_number_id!,
        accessToken:   whatsappConfig.access_token!,
      })
      await supabase.from("messages").insert({
        conversation_id:     conversationId,
        content:             greeting,
        direction:           "outbound",
        sent_by_ai:          true,
        whatsapp_message_id: sentGreeting?.messages?.[0]?.id ?? null,
      })
      console.log(`👋 Saludo enviado a ${from}`)
    } catch (err) {
      console.error("❌ Error enviando saludo:", err)
    }
  }

  let aiReply: Awaited<ReturnType<typeof generateReply>>
  try {
    aiReply = await generateReply({ userMessage: textForAI, systemPrompt, conversationHistory: history })
    console.log(`🤖 generateReply → replies=${aiReply.replies.length}, product="${aiReply.productName}"`, aiReply.replies.map(r => r.substring(0, 80)))
  } catch (err) {
    console.error("❌ Error generando respuesta con IA:", err)
    await sendFallback()
    return
  }

  let { replies, productName, leadNotes } = aiReply
  let sendLocation = aiReply.sendLocation
  const handover = aiReply.handover || replies.some(r => r.toLowerCase().includes("dame un momento"))

  console.log(`🔀 handover=${handover}`)

  // Guardar notas del lead
  if (leadNotes) {
    const timestamp   = new Date().toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })
    const newNote     = `[${timestamp}] ${leadNotes}`
    const { data: currentContact } = await supabase
      .from("contacts").select("notes").eq("id", contact.id).single()
    const updatedNotes = currentContact?.notes
      ? `${currentContact.notes}\n${newNote}`
      : newNote
    await supabase.from("contacts").update({ notes: updatedNotes }).eq("id", contact.id)
    console.log(`📝 Nota guardada para ${from}: "${leadNotes}"`)
  }

  // Handover: pausar IA y notificar asesores
  if (handover) {
    await supabase.from("conversations").update({ ai_paused: true }).eq("id", conversationId)
    console.log(`🤝 Handover activado para conversación ${conversationId}`)

    const { data: contactInfo } = await supabase
      .from("contacts").select("name, phone").eq("id", contact.id).single()
    const clientName  = contactInfo?.name ?? contactInfo?.phone ?? from
    const orderDetail = leadNotes ? `\n\n📋 *Detalle:* ${leadNotes}` : ""
    const alertMsg    = `🛒 *Pedido confirmado*\n\nCliente: *${clientName}*\nTeléfono: ${from}${orderDetail}\n\n👉 Coordina el pago y la entrega.`

    const ALERT_NUMBERS  = ["18094173098", "18292856400"]
    const templateParams = [
      clientName,
      from,
      productName ? `El cliente está solicitando: ${productName}` : leadNotes ? `Detalle: ${leadNotes}` : "Sin detalles adicionales",
    ]
    const fallbackText = `🛒 *Pedido confirmado*\n\nCliente: *${clientName}*\nTeléfono: ${from}${orderDetail}\n\n👉 Coordina el pago y la entrega.`

    for (const num of ALERT_NUMBERS) {
      try {
        await sendWhatsAppTemplate({
          to:            num,
          templateName:  "confirmacin_de_pedido",
          parameters:    templateParams,
          phoneNumberId: whatsappConfig.phone_number_id!,
          accessToken:   whatsappConfig.access_token!,
        })
        console.log(`📲 Alerta (template) enviada a ${num}`)
      } catch (templateErr: any) {
        console.error(`❌ Template falló para ${num} — error Meta:`, templateErr?.message ?? templateErr)
        // Fallback: texto directo
        try {
          await sendWhatsAppMessage({
            to:            num,
            message:       fallbackText,
            phoneNumberId: whatsappConfig.phone_number_id!,
            accessToken:   whatsappConfig.access_token!,
          })
          console.log(`📲 Alerta (texto fallback) enviada a ${num}`)
        } catch (textErr: any) {
          console.error(`❌ Fallback texto también falló para ${num} — error Meta:`, textErr?.message ?? textErr)
        }
      }
    }
  }

  // Enviar ubicación si el AI lo indicó
  if (sendLocation) {
    const lat     = storeLat
    const lng     = storeLng
    const name    = companyName ?? process.env.STORE_NAME ?? "Nuestra tienda"
    const address = storeAddress

    if (lat && lng) {
      try {
        const sentLoc = await sendWhatsAppLocation({
          to: from, latitude: lat, longitude: lng, name, address,
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

        // Enviar también la dirección escrita
        if (address) {
          const addressText = `📍 *${name}*\n${address}`
          const sentAddr = await sendWhatsAppMessage({
            to: from, message: addressText,
            phoneNumberId: whatsappConfig.phone_number_id!,
            accessToken:   whatsappConfig.access_token!,
          })
          await supabase.from("messages").insert({
            conversation_id:     conversationId,
            content:             addressText,
            direction:           "outbound",
            sent_by_ai:          true,
            whatsapp_message_id: sentAddr?.messages?.[0]?.id ?? null,
          })
        }
      } catch (err) {
        console.error("❌ Error enviando ubicación:", err)
      }
    }
  }

  // Enviar imagen del producto si el AI lo indicó
  if (productName) {
    const imageUrl =
      findImageUrl(productName, kainoCatalogImageMap) ??
      findImageUrl(productName, sheetData.imageMap)
    if (imageUrl) {
      try {
        await sendWhatsAppImageByUrl({
          to:            from,
          url:           imageUrl,
          phoneNumberId: whatsappConfig.phone_number_id!,
          accessToken:   whatsappConfig.access_token!,
        })
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          content:         imageUrl,
          direction:       "outbound",
          sent_by_ai:      true,
          message_type:    "image",
        })
        console.log(`🖼️ Imagen de "${productName}" enviada a ${from}`)
      } catch (err) {
        console.error(`❌ Error enviando imagen de "${productName}":`, err)
      }
    } else {
      // Foto no disponible: activar handover y notificar a los asesores
      console.log(`⚠️ Foto de "${productName}" no disponible — activando handover y notificando asesores`)

      await supabase.from("conversations").update({ ai_paused: true }).eq("id", conversationId)

      // Avisar al cliente que espere
      const waitMsg = "Dame un momento ⏳ Voy a buscar esa foto para ti."
      try {
        const sentWait = await sendWhatsAppMessage({
          to:            from,
          message:       waitMsg,
          phoneNumberId: whatsappConfig.phone_number_id!,
          accessToken:   whatsappConfig.access_token!,
        })
        await supabase.from("messages").insert({
          conversation_id:     conversationId,
          content:             waitMsg,
          direction:           "outbound",
          sent_by_ai:          true,
          whatsapp_message_id: sentWait?.messages?.[0]?.id ?? null,
        })
      } catch (err) {
        console.error("❌ Error enviando mensaje de espera al cliente:", err)
      }

      // Limpiar replies del AI para no enviar texto confuso sobre la foto
      replies = []

      // Notificar a los asesores autorizados
      const { data: contactInfoForPhoto } = await supabase
        .from("contacts").select("name, phone").eq("id", contact.id).single()
      const clientNameForPhoto = contactInfoForPhoto?.name ?? contactInfoForPhoto?.phone ?? from

      const ALERT_NUMBERS  = ["18094173098", "18292856400"]
      const templateParams = [clientNameForPhoto, from, `El cliente quiere la foto del producto: ${productName}`]
      const fallbackText   = `📸 *Foto solicitada*\n\nCliente: *${clientNameForPhoto}*\nTeléfono: ${from}\n\nEl cliente quiere la foto del producto: ${productName}\n\n👉 Envía la foto directamente al cliente.`

      for (const num of ALERT_NUMBERS) {
        try {
          await sendWhatsAppTemplate({
            to:            num,
            templateName:  "confirmacin_de_pedido",
            parameters:    templateParams,
            phoneNumberId: whatsappConfig.phone_number_id!,
            accessToken:   whatsappConfig.access_token!,
          })
          console.log(`📲 Solicitud de foto (template) enviada a ${num}`)
        } catch (templateErr: any) {
          console.error(`❌ Template falló para ${num}:`, templateErr?.message ?? templateErr)
          try {
            await sendWhatsAppMessage({
              to:            num,
              message:       fallbackText,
              phoneNumberId: whatsappConfig.phone_number_id!,
              accessToken:   whatsappConfig.access_token!,
            })
            console.log(`📲 Solicitud de foto (texto fallback) enviada a ${num}`)
          } catch (textErr: any) {
            console.error(`❌ Fallback texto también falló para ${num}:`, textErr?.message ?? textErr)
          }
        }
      }
    }
  }

  // Enviar mensajes de texto de respuesta (uno por uno)
  if (replies.length > 0) {
    for (const msg of replies) {
      try {
        const sent = await sendWhatsAppMessage({
          to: from, message: msg,
          phoneNumberId: whatsappConfig.phone_number_id!,
          accessToken:   whatsappConfig.access_token!,
        })
        await supabase.from("messages").insert({
          conversation_id:     conversationId,
          content:             msg,
          direction:           "outbound",
          sent_by_ai:          true,
          whatsapp_message_id: sent?.messages?.[0]?.id ?? null,
        })
        console.log(`🤖 Mensaje enviado a ${from}: "${msg}"`)
      } catch (err) {
        console.error("❌ Error enviando texto:", err)
        await sendFallback()
        break
      }
    }
  } else if (!productName && !sendLocation && !handover) {
    await sendFallback()
  }
}
