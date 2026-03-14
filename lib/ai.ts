// Funciones de IA — genera respuestas usando Google Gemini

import { GoogleGenerativeAI } from "@google/generative-ai"

// Crear el cliente una sola vez (singleton)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Genera una respuesta automática para un mensaje de WhatsApp
export async function generateReply({
  userMessage,
  systemPrompt,
  conversationHistory = [],
}: {
  userMessage: string
  systemPrompt: string
  conversationHistory?: { role: "user" | "assistant"; content: string }[]
}) {
  // gemini-1.5-flash: rápido y barato, perfecto para respuestas de WhatsApp
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // systemInstruction: equivalente al "system prompt" de OpenAI
    // Le da personalidad e instrucciones al bot
    systemInstruction: systemPrompt,
  })

  // Gemini usa "parts" para el historial de conversación
  // Convertimos nuestro formato { role, content } al formato de Gemini
  const history = conversationHistory.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",  // Gemini usa "model" en vez de "assistant"
    parts: [{ text: msg.content }],
  }))

  // startChat mantiene el contexto de la conversación
  const chat = model.startChat({ history })

  // Enviar el mensaje actual y esperar la respuesta
  const result = await chat.sendMessage(userMessage)
  return result.response.text()
}
