// POST /api/contacts — crea un contacto manualmente

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const body = await req.json()
  const phone = (body.phone ?? "").trim()
  const name  = (body.name  ?? "").trim() || null
  const notes = (body.notes ?? "").trim() || null

  if (!phone) return NextResponse.json({ error: "El teléfono es obligatorio" }, { status: 400 })

  const { data, error } = await supabase
    .from("contacts")
    .upsert(
      { tenant_id: tenant.id, phone, name, notes },
      { onConflict: "tenant_id,phone" }
    )
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
