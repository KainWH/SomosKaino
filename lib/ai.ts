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

FORMATO DE RESPUESTA OBLIGATORIO — responde SIEMPRE con este JSON exacto en una sola línea, sin markdown ni texto fuera. NUNCA omitas ningún campo — el JSON debe tener los 5 campos siempre:
{"reply":"mensaje al cliente","product_name":null,"send_location":false,"handover":false,"lead_notes":null}

Reglas:
- reply: tu mensaje al cliente.
- product_name: SOLO si el cliente explícitamente pide ver una foto, imagen o picture de un producto (ej: "¿me puedes mandar una foto?", "¿tiene foto?", "mándame la imagen"), escribe el nombre exacto del modelo como aparece en los datos (ej: "Samsung Galaxy A07"). En cualquier otro caso pon null — NO envíes imagen solo porque estás describiendo un producto. NO pongas URLs ni rutas de archivo.
- send_location: pon true ÚNICAMENTE si el cliente pregunta por la dirección, ubicación o cómo llegar a la tienda. Pon false en todos los demás casos.
- handover: pon true en dos situaciones: (1) cuando el cliente responda cuál es su método de pago (ej: "transferencia", "efectivo", "tarjeta", "Cardnet"), o (2) cuando el cliente confirme en firme el pedido después de recibir el resumen o el precio de envío (ej: "sí", "listo", "dale", "confírmalo", "lo quiero"). En cualquiera de esos casos responde SOLO con "Dame un momento ⏳" y pon handover en true. También pon true si el cliente pide hablar con un humano o expresa frustración repetida. Pon false en todos los demás casos.
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
    // Eliminar markdown si existe, luego intentar extraer el JSON aunque haya texto extra alrededor
    const stripped = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "")
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")
    const parsed  = JSON.parse(jsonMatch[0])
    const reply   = (parsed.reply ?? "").trim()
    // Fallback de seguridad: si el reply incluye "Dame un momento" pero handover no está en true, forzarlo
    const handover = parsed.handover === true || reply.toLowerCase().includes("dame un momento")
    return {
      reply,
      productName:  parsed.product_name && parsed.product_name !== "null" ? parsed.product_name : null,
      sendLocation: parsed.send_location === true,
      handover,
      leadNotes:    parsed.lead_notes && parsed.lead_notes !== "null" ? parsed.lead_notes.trim() : null,
    }
  } catch {
    console.warn("⚠️ Gemini no devolvió JSON válido:", raw.substring(0, 200))
    return { reply: "", productName: null, sendLocation: false, handover: false, leadNotes: null }
  }
}
