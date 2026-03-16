import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET — listar todos los documentos del tenant
export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { data } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at")

  return NextResponse.json(data ?? [])
}

// POST — crear nuevo documento
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { name, content } = await request.json()

  if (!name?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Nombre y contenido son requeridos" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("knowledge_documents")
    .insert({ tenant_id: tenant.id, name: name.trim(), content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
