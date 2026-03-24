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
{"reply":["mensaje al cliente"],"product_name":null,"send_location":false,"handover":false,"lead_notes":null}

Reglas:
- reply: array de mensajes de texto. Cada elemento se envía como WhatsApp separado. Reglas estrictas:
  1. FLUJO DE VENTA OBLIGATORIO:
     - Si el cliente menciona un producto específico que existe en el catálogo: muéstraselo directamente, SIN recomendar otros productos.
     - Si el cliente es vago o no queda claro a qué producto se refiere: hazle UNA sola pregunta para entender qué busca. NO hagas recomendaciones hasta que quede claro.
     - Haz UNA sola pregunta por mensaje — nunca dos preguntas a la vez.
     - NUNCA ofrezcas alternativas ni recomendaciones cuando ya sabes qué producto quiere el cliente.
  2. Cuando el cliente pide ver productos disponibles (sin especificar uno): muestra SOLO los más relevantes. Envía CADA producto en su propio elemento del array con formato: "Nombre — Precio" (ej: ["Samsung Galaxy A07 — RD$8,500", "Xiaomi Redmi 13C — RD$6,200"]). Termina con "¿Cuál te interesa?". MÁXIMO 5 productos a la vez. NUNCA listes todo el catálogo.
  3. Para respuestas simples (sin lista de productos), usa un solo elemento de máximo 2 oraciones.
  4. NUNCA listes especificaciones técnicas (mAh, watts, puertos, RAM, etc.) a menos que el cliente las pida explícitamente.
- product_name: SOLO si el cliente explícitamente pide ver una foto, imagen o picture de un producto (ej: "¿me puedes mandar una foto?", "¿tiene foto?", "mándame la imagen"), escribe el nombre exacto del modelo como aparece en los datos (ej: "Samsung Galaxy A07"). En cualquier otro caso pon null — NO envíes imagen solo porque estás describiendo un producto. NO pongas URLs ni rutas de archivo.
- send_location: pon true ÚNICAMENTE si el cliente pregunta por la dirección, ubicación o cómo llegar a la tienda. Pon false en todos los demás casos.
- handover: pon true cuando el cliente indique su método de pago (ej: "transferencia", "efectivo", "transfer", "cash"). En ese caso responde SOLO con ["Dame un momento ⏳"] y pon handover en true. También pon true si el cliente pide hablar con un humano o expresa frustración repetida. Pon false en todos los demás casos.
- lead_notes: si en este mensaje el cliente reveló información relevante (nombre, producto de interés, presupuesto, zona, urgencia, contexto de compra), escribe un resumen breve en español de máximo 2 oraciones. Si no hay información nueva relevante, pon null.`

export type AIReply = {
  replies:      string[]
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
    return { replies: [], productName: null, sendLocation: false, handover: false, leadNotes: null }
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
      return { replies: [], productName, sendLocation: false, handover: false, leadNotes: null }
    }
    console.warn("⚠️ Gemini usó tool_code pero no se pudo extraer el producto")
    return { replies: [], productName: null, sendLocation: false, handover: false, leadNotes: null }
  }

  try {
    // Eliminar markdown si existe, luego intentar extraer el JSON aunque haya texto extra alrededor
    const stripped = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "")
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")
    const parsed = JSON.parse(jsonMatch[0])

    // Normalizar reply: puede ser string o array
    const rawReply = parsed.reply ?? ""
    const replies: string[] = Array.isArray(rawReply)
      ? rawReply.map((r: string) => String(r).trim()).filter(Boolean)
      : [String(rawReply).trim()].filter(Boolean)

    // Fallback de seguridad: si algún reply incluye "Dame un momento" pero handover no está en true, forzarlo
    const handover = parsed.handover === true || replies.some(r => r.toLowerCase().includes("dame un momento"))
    return {
      replies,
      productName:  parsed.product_name && parsed.product_name !== "null" ? parsed.product_name : null,
      sendLocation: parsed.send_location === true,
      handover,
      leadNotes:    parsed.lead_notes && parsed.lead_notes !== "null" ? parsed.lead_notes.trim() : null,
    }
  } catch {
    console.warn("⚠️ Gemini no devolvió JSON válido:", raw.substring(0, 200))
    return { replies: [], productName: null, sendLocation: false, handover: false, leadNotes: null }
  }
}
