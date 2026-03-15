import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  // Verificar que la conversación pertenece al tenant
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!conversation) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, direction, sent_by_ai, created_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true })

  return NextResponse.json(messages ?? [])
}
