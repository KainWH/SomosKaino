import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ── GET /api/orders ────────────────────────────────────────────────────────────
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// ── POST /api/orders ───────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const body = await request.json()
  const {
    code, city, agency,
    client_name, client_phone, client_address,
    product, sku, unit_price, units,
  } = body

  if (!city?.trim() || !client_name?.trim() || !product?.trim()) {
    return NextResponse.json({ error: "Ciudad, cliente y producto son requeridos" }, { status: 400 })
  }

  const u     = Math.max(1, parseInt(units) || 1)
  const price = parseFloat(unit_price) || 0

  const { data, error } = await supabase
    .from("orders")
    .insert({
      tenant_id:      tenant.id,
      code:           (code || "").toUpperCase().slice(0, 4),
      city:           city.trim(),
      agency:         agency?.trim() || "",
      client_name:    client_name.trim(),
      client_phone:   client_phone?.trim() || "",
      client_address: client_address?.trim() || "",
      product:        product.trim(),
      sku:            (sku || "").toUpperCase(),
      unit_price:     price,
      units:          u,
      total:          price * u,
      status:         "pending",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
