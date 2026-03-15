// API Route: /api/webhook/whatsapp
// Meta envía los mensajes de WhatsApp a esta URL (POST)
// También usa GET para verificar el webhook al configurarlo

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateReply, transcribeAudio } from "@/lib/ai"
import { sendWhatsAppMessage, markAsRead, downloadMedia } from "@/lib/whatsapp"

// Cliente con service role — bypasa RLS, solo usar en el servidor
// El webhook no tiene sesión de usuario, por eso necesitamos este cliente especial
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

  // Meta envía tu VERIFY_TOKEN para confirmar que eres tú
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ Webhook de WhatsApp verificado")
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Token inválido" }, { status: 403 })
}

// ── POST: Recibe mensajes nuevos de WhatsApp ──
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Meta anida los datos así: entry[0].changes[0].value
  const value    = body?.entry?.[0]?.changes?.[0]?.value
  const messages = value?.messages

  // Si no hay mensajes (puede ser una notificación de estado), ignorar
  if (!messages || messages.length === 0) {
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const message       = messages[0]
  const from          = message.from
  const whatsappMsgId = message.id
  const phoneNumberId = value?.metadata?.phone_number_id

  // Solo procesamos texto y audio
  if (message.type !== "text" && message.type !== "audio") {
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const supabase = createServiceClient()

  // ── PASO 1: Encontrar a qué tenant pertenece este número de WhatsApp ──
  const { data: whatsappConfig } = await supabase
    .from("whatsapp_configs")
    .select("tenant_id, access_token, phone_number_id")
    .eq("phone_number_id", phoneNumberId)
    .single()

  if (!whatsappConfig) {
    // Ningún tenant tiene configurado este número — ignorar
    console.error(`❌ No se encontró tenant para phone_number_id: ${phoneNumberId}`)
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  const tenantId = whatsappConfig.tenant_id

  // ── Obtener el texto del mensaje ──
  // textForAI = lo que procesa el agente (transcripción real si es audio)
  // textForDB  = lo que se guarda/muestra en el chat
  let textForAI = message.text?.body ?? ""
  let textForDB = textForAI

  if (message.type === "audio" && message.audio?.id) {
    const media = await downloadMedia({
      mediaId:     message.audio.id,
      accessToken: whatsappConfig.access_token!,
    })
    if (!media) {
      console.error("❌ No se pudo descargar el audio")
      return NextResponse.json({ status: "ok" }, { status: 200 })
    }
    const transcription = await transcribeAudio(media.buffer, media.mimeType)
    if (!transcription) {
      console.error("❌ No se pudo transcribir el audio")
      return NextResponse.json({ status: "ok" }, { status: 200 })
    }
    textForAI = transcription          // el agente lee la transcripción completa
    textForDB = "🎤 Nota de voz"       // en el chat solo se muestra esto
    console.log(`🎤 Audio transcrito de ${from}: "${transcription}"`)
  }

  if (!textForAI) {
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  // ── PASO 2: Crear o actualizar el contacto ──
  // upsert = INSERT si no existe, UPDATE si ya existe (basado en tenant_id + phone)
  const { data: contact } = await supabase
    .from("contacts")
    .upsert(
      {
        tenant_id:       tenantId,
        phone:           from,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,phone" }
    )
    .select("id")
    .single()

  if (!contact) {
    console.error("❌ Error al crear/actualizar contacto")
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  // ── PASO 3: Encontrar conversación abierta o crear una nueva ──
  // Primero intentamos encontrar una conversación abierta existente
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id, ai_paused")
    .eq("tenant_id", tenantId)
    .eq("contact_id", contact.id)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let conversationId: string
  let aiPaused = false

  if (existingConversation) {
    conversationId = existingConversation.id
    aiPaused = existingConversation.ai_paused ?? false
  } else {
    // No hay conversación abierta — crear una nueva
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

  // ── PASO 4: Guardar el mensaje entrante ──
  await supabase.from("messages").insert({
    conversation_id:     conversationId,
    content:             textForDB,
    direction:           "inbound",
    sent_by_ai:          false,
    whatsapp_message_id: whatsappMsgId,
  })

  console.log(`📩 Mensaje guardado de ${from}: "${textForDB}"`)

  // ── PASO 5: Marcar como leído (palomitas azules) ──
  await markAsRead({
    messageId:     whatsappMsgId,
    phoneNumberId: whatsappConfig.phone_number_id!,
    accessToken:   whatsappConfig.access_token!,
  })

  // ── PASO 6: Respuesta automática con IA (si está habilitada) ──
  const { data: aiConfig } = await supabase
    .from("ai_configs")
    .select("enabled, system_prompt")
    .eq("tenant_id", tenantId)
    .single()

  if (aiConfig?.enabled && !aiPaused) {
    // Obtener los últimos 10 mensajes para dar contexto a la IA
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("content, direction")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10)

    // Convertir al formato que espera generateReply, excluyendo el mensaje que acabamos de guardar
    const history = (recentMessages ?? [])
      .reverse()
      .slice(0, -1)  // quitar el último (el mensaje actual)
      .map(msg => ({
        role:    msg.direction === "inbound" ? "user" as const : "assistant" as const,
        content: msg.content,
      }))

    // Generar respuesta con Gemini
    const reply = await generateReply({
      userMessage:         textForAI,
      systemPrompt:        aiConfig.system_prompt,
      conversationHistory: history,
    })

    // Enviar respuesta por WhatsApp
    const sent = await sendWhatsAppMessage({
      to:            from,
      message:       reply,
      phoneNumberId: whatsappConfig.phone_number_id!,
      accessToken:   whatsappConfig.access_token!,
    })

    // Guardar el mensaje saliente en la BD
    await supabase.from("messages").insert({
      conversation_id:     conversationId,
      content:             reply,
      direction:           "outbound",
      sent_by_ai:          true,
      whatsapp_message_id: sent?.messages?.[0]?.id ?? null,
    })

    console.log(`🤖 Respuesta IA enviada a ${from}: "${reply}"`)
  }

  // Siempre responder 200 a Meta — si no, reintenta el envío indefinidamente
  return NextResponse.json({ status: "ok" }, { status: 200 })
}
