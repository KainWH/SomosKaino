import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { syncProductToMeta } from "@/lib/whatsapp-catalog"

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { data } = await supabase
    .from("catalog_products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("enabled", true)
    .order("created_at", { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const body = await request.json()
  const { name, description, price, currency, image_url, category } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("catalog_products")
    .insert({
      tenant_id:   tenant.id,
      name:        name.trim(),
      description: description?.trim() || null,
      price:       price ? Number(price) : null,
      currency:    currency || "USD",
      image_url:   image_url || null,
      category:    category?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Sincronizar automáticamente con WhatsApp Business Catalog ──
  const { data: waConfig } = await supabase
    .from("whatsapp_configs")
    .select("catalog_id, access_token")
    .eq("tenant_id", tenant.id)
    .single()

  let waSynced = false
  let waSyncError: string | undefined

  if (waConfig?.catalog_id && waConfig?.access_token) {
    const sync = await syncProductToMeta({
      catalogId:   waConfig.catalog_id,
      accessToken: waConfig.access_token,
      product:     data,
      method:      "CREATE",
    })
    waSynced    = sync.success
    waSyncError = sync.error
  }

  return NextResponse.json({ ...data, _wa: { synced: waSynced, error: waSyncError } })
}
