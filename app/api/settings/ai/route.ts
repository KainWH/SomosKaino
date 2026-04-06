import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { data, error } = await supabase
    .from("ai_configs")
    .select("enabled, system_prompt, alert_numbers, greeting_message, handover_template")
    .eq("tenant_id", tenant.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const body = await request.json()
  const { system_prompt, enabled, alert_numbers, greeting_message, handover_template } = body

  // Validar system_prompt
  if (typeof system_prompt !== "string" || system_prompt.trim().length === 0) {
    return NextResponse.json({ error: "El prompt del sistema no puede estar vacío" }, { status: 400 })
  }
  if (system_prompt.length > 8000) {
    return NextResponse.json({ error: "El prompt del sistema no puede superar 8000 caracteres" }, { status: 400 })
  }

  // Validar alert_numbers — formato E.164: solo dígitos, 7-15 chars
  if (alert_numbers !== undefined) {
    if (!Array.isArray(alert_numbers)) {
      return NextResponse.json({ error: "alert_numbers debe ser un array" }, { status: 400 })
    }
    const phoneRegex = /^\d{7,15}$/
    const invalid = (alert_numbers as unknown[]).filter(n => typeof n !== "string" || !phoneRegex.test(n))
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Números inválidos: ${invalid.join(", ")}. Usa solo dígitos sin + ni espacios (ej: 18094173098)` }, { status: 400 })
    }
    if (alert_numbers.length > 10) {
      return NextResponse.json({ error: "Máximo 10 números de alerta" }, { status: 400 })
    }
  }

  // Validar greeting_message
  if (greeting_message !== null && greeting_message !== undefined) {
    if (typeof greeting_message !== "string" || greeting_message.length > 500) {
      return NextResponse.json({ error: "El mensaje de bienvenida no puede superar 500 caracteres" }, { status: 400 })
    }
  }

  // Validar handover_template
  if (handover_template !== null && handover_template !== undefined) {
    if (typeof handover_template !== "string" || handover_template.length > 200) {
      return NextResponse.json({ error: "El nombre del template no puede superar 200 caracteres" }, { status: 400 })
    }
  }

  const { error } = await supabase
    .from("ai_configs")
    .update({ system_prompt: system_prompt.trim(), enabled, alert_numbers, greeting_message, handover_template })
    .eq("tenant_id", tenant.id)

  if (error) return NextResponse.json({ error: "Error al guardar la configuración" }, { status: 500 })

  return NextResponse.json({ success: true })
}
