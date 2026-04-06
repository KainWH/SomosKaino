// API Route: /api/ai/respond
// Recibe un mensaje y devuelve una respuesta generada por Gemini

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateReply } from "@/lib/ai"

export async function POST(request: NextRequest) {
  // Autenticación obligatoria
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { message, systemPrompt, conversationHistory } = await request.json()

  if (!message) {
    return NextResponse.json({ error: "Falta el mensaje" }, { status: 400 })
  }

  const prompt = systemPrompt ||
    "Eres un asistente de bienes raíces amable y profesional. Responde en español de forma concisa."

  const reply = await generateReply({
    userMessage: message,
    systemPrompt: prompt,
    conversationHistory: conversationHistory ?? [],
  })

  return NextResponse.json({ reply }, { status: 200 })
}
