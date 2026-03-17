// Funciones de IA — Google Gemini vía @google/genai SDK

import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// Transcribe una nota de voz usando Gemini multimodal
export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString("base64")

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: "Transcribe exactamente lo que dice este mensaje de voz. Devuelve solo la transcripción, sin explicaciones ni comillas." },
      ],
    }],
  })

  return response.text?.trim() ?? ""
}

// Describe una imagen recibida por WhatsApp para pasarla al agente como contexto
export async function describeImage(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString("base64")

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: "Describe brevemente qué muestra esta imagen en español, en máximo 2 oraciones. Solo la descripción, sin explicaciones adicionales." },
      ],
    }],
  })

  return response.text?.trim() ?? ""
}

const JSON_FORMAT_INSTRUCTION = `

FORMATO DE RESPUESTA OBLIGATORIO — responde SIEMPRE con este JSON en una sola línea, sin markdown ni texto fuera:
{"reply":"mensaje al cliente","product_name":null,"send_location":false,"handover":false,"lead_notes":null}

Reglas:
- reply: tu mensaje al cliente.
- product_name: si el cliente pide ver la foto de un producto o estás describiendo uno específico, escribe el nombre exacto del modelo como aparece en los datos (ej: "Samsung Galaxy A07"). Pon null si no aplica. NO pongas URLs ni rutas de archivo.
- send_location: pon true ÚNICAMENTE si el cliente pregunta por la dirección, ubicación o cómo llegar a la tienda. Pon false en todos los demás casos.
- handover: pon true si el cliente pide explícitamente hablar con un humano o asesor, expresa frustración repetida, quiere cerrar una compra/trato que requiere confirmación real, o hace una pregunta que claramente no puedes responder con certeza. Cuando sea true, tu reply debe ser un mensaje de transición natural (ej: "Con gusto te paso con uno de nuestros asesores, estarán contigo en un momento 👋"). Pon false en todos los demás casos.
- lead_notes: si en este mensaje el cliente reveló información relevante (nombre, producto de interés, presupuesto, zona, urgencia, contexto de compra), escribe un resumen breve en español de máximo 2 oraciones. Si no hay información nueva relevante, pon null.`

export type AIReply = {
  reply:        string
  productName:  string | null
  sendLocation: boolean
  handover:     boolean
  leadNotes:    string | null
}

export async function generateReply({
  userMessage,
  systemPrompt,
  conversationHistory = [],
}: {
  userMessage: string
  systemPrompt: string
  conversationHistory?: { role: "user" | "assistant"; content: string }[]
}): Promise<AIReply> {
  const contents = [
    ...conversationHistory.map((msg) => ({
      role:  msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ]

  const response = await ai.models.generateContent({
    model:    "gemini-2.5-flash",
    contents,
    config: { systemInstruction: systemPrompt + JSON_FORMAT_INSTRUCTION },
  })

  const raw = response.text?.trim() ?? ""
  console.log(`🤖 Gemini raw (${raw.length} chars):`, raw.substring(0, 300))

  if (!raw) {
    console.warn("⚠️ Gemini devolvió respuesta vacía")
    return { reply: "", productName: null, sendLocation: false, handover: false, leadNotes: null }
  }

  // Gemini a veces alucina un "tool_code" de Drive — extraemos el nombre del producto del filename
  if (raw.includes("tool_code") || raw.includes("Drive(")) {
    const fileMatch = raw.match(/file_name=['"]([^'"]+)['"]/)
    if (fileMatch) {
      const productName = fileMatch[1]
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      console.warn(`⚠️ Gemini usó tool_code — extrayendo producto: "${productName}"`)
      return { reply: "", productName, sendLocation: false, handover: false, leadNotes: null }
    }
    console.warn("⚠️ Gemini usó tool_code pero no se pudo extraer el producto")
    return { reply: "", productName: null, sendLocation: false, handover: false, leadNotes: null }
  }

  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "")
    const parsed  = JSON.parse(cleaned)
    return {
      reply:        (parsed.reply ?? "").trim(),
      productName:  parsed.product_name && parsed.product_name !== "null" ? parsed.product_name : null,
      sendLocation: parsed.send_location === true,
      handover:     parsed.handover === true,
      leadNotes:    parsed.lead_notes && parsed.lead_notes !== "null" ? parsed.lead_notes.trim() : null,
    }
  } catch {
    console.warn("⚠️ Gemini no devolvió JSON válido, usando texto plano")
    return { reply: raw, productName: null, sendLocation: false, handover: false, leadNotes: null }
  }
}
