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
IMPORTANTE: Responde SIEMPRE con JSON válido en este formato exacto:
{"reply": "tu mensaje de texto aquí", "image_url": "URL completa de la imagen o null"}
- Usa image_url solo cuando el usuario pida ver una foto/imagen de un producto y tengas una URL en los datos de propiedades.
- Si no necesitas enviar imagen, pon null en image_url.
- No incluyas markdown, bloques de código ni texto fuera del JSON.`

export async function generateReply({
  userMessage,
  systemPrompt,
  conversationHistory = [],
}: {
  userMessage: string
  systemPrompt: string
  conversationHistory?: { role: "user" | "assistant"; content: string }[]
}): Promise<{ reply: string; image_url: string | null }> {
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
    return { reply: "", image_url: null }
  }

  // Intentar parsear JSON — si falla, usar el texto tal cual sin imagen
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "")
    const parsed = JSON.parse(cleaned)
    return {
      reply:     (parsed.reply ?? "").trim(),
      image_url: parsed.image_url && parsed.image_url !== "null" ? parsed.image_url : null,
    }
  } catch {
    console.warn("⚠️ Gemini no devolvió JSON válido, usando texto plano")
    return { reply: raw, image_url: null }
  }
}
