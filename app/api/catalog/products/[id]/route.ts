import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { syncProductToMeta } from "@/lib/whatsapp-catalog"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.name        !== undefined) updates.name        = body.name.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.price       !== undefined) updates.price       = body.price ? Number(body.price) : null
  if (body.currency    !== undefined) updates.currency    = body.currency
  if (body.image_url   !== undefined) updates.image_url   = body.image_url || null
  if (body.category    !== undefined) updates.category    = body.category?.trim() || null
  if (body.enabled     !== undefined) updates.enabled     = body.enabled

  const { data, error } = await supabase
    .from("catalog_products")
    .update(updates)
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Sincronizar con WhatsApp Business ──
  const { data: waConfig } = await supabase
    .from("whatsapp_configs")
    .select("catalog_id, access_token")
    .eq("tenant_id", tenant.id)
    .single()

  let waSynced = false
  let waSyncError: string | undefined

  if (waConfig?.catalog_id && waConfig?.access_token && data.enabled) {
    // Si se deshabilitó el producto, eliminarlo del catálogo WA
    const method = body.enabled === false ? "DELETE" : "UPDATE"
    const sync = await syncProductToMeta({
      catalogId:   waConfig.catalog_id,
      accessToken: waConfig.access_token,
      product:     data,
      method,
    })
    waSynced    = sync.success
    waSyncError = sync.error
  } else if (waConfig?.catalog_id && waConfig?.access_token && body.enabled === false) {
    // Producto deshabilitado → borrar de WA
    const sync = await syncProductToMeta({
      catalogId:   waConfig.catalog_id,
      accessToken: waConfig.access_token,
      product:     data,
      method:      "DELETE",
    })
    waSynced    = sync.success
    waSyncError = sync.error
  }

  return NextResponse.json({ ...data, _wa: { synced: waSynced, error: waSyncError } })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { data: product } = await supabase
    .from("catalog_products")
    .select("*")
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .single()

  const { error } = await supabase
    .from("catalog_products")
    .delete()
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Eliminar imagen del storage ──
  if (product?.image_url) {
    try {
      const service = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const path = product.image_url.split("/catalog-images/")[1]
      if (path) await service.storage.from("catalog-images").remove([path])
    } catch { /* no crítico */ }
  }

  // ── Eliminar del catálogo de WhatsApp Business ──
  const { data: waConfig } = await supabase
    .from("whatsapp_configs")
    .select("catalog_id, access_token")
    .eq("tenant_id", tenant.id)
    .single()

  let waSynced = false
  if (waConfig?.catalog_id && waConfig?.access_token && product) {
    const sync = await syncProductToMeta({
      catalogId:   waConfig.catalog_id,
      accessToken: waConfig.access_token,
      product,
      method:      "DELETE",
    })
    waSynced = sync.success
  }

  return NextResponse.json({ success: true, _wa: { synced: waSynced } })
}
