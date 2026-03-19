import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getTenant(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  return tenant
}

// ── PATCH /api/orders/[id] ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body    = await request.json()
  const allowed = ["status", "code", "city", "agency", "client_name", "client_phone",
                   "client_address", "product", "sku", "unit_price", "units", "total"]
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  // Recalculate total if price or units changed
  if ("unit_price" in update || "units" in update) {
    const { data: existing } = await supabase
      .from("orders").select("unit_price, units").eq("id", params.id).single()
    const price = parseFloat(String(update.unit_price ?? existing?.unit_price ?? 0))
    const units = parseInt(String(update.units       ?? existing?.units       ?? 1))
    update.total = price * units
  }

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── DELETE /api/orders/[id] ────────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
