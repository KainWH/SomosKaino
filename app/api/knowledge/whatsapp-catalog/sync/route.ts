import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { syncAllProductsToMeta } from "@/lib/whatsapp-catalog"

// POST — conectar catalog_id y subir todos los productos existentes de RentIA a Meta
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { catalog_id } = await request.json()

  const { data: waConfig } = await supabase
    .from("whatsapp_configs")
    .select("access_token, catalog_id")
    .eq("tenant_id", tenant.id)
    .single()

  if (!waConfig?.access_token) {
    return NextResponse.json(
      { error: "Primero configura tu token de acceso de WhatsApp en Configuración" },
      { status: 400 }
    )
  }

  const isNewConnection = !waConfig.catalog_id && !!catalog_id?.trim()

  // Guardar el catalog_id
  const { error: saveError } = await supabase
    .from("whatsapp_configs")
    .update({ catalog_id: catalog_id?.trim() || null })
    .eq("tenant_id", tenant.id)

  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

  if (!catalog_id?.trim()) {
    return NextResponse.json({ success: true, synced: 0 })
  }

  // Obtener todos los productos activos de RentIA
  const { data: products } = await supabase
    .from("catalog_products")
    .select("id, name, description, price, currency, image_url")
    .eq("tenant_id", tenant.id)
    .eq("enabled", true)

  if (!products || products.length === 0) {
    return NextResponse.json({
      success: true,
      synced:  0,
      message: isNewConnection
        ? "Catálogo conectado. Crea productos en RentIA y se publicarán automáticamente."
        : "No hay productos activos para sincronizar.",
    })
  }

  // Subir todos los productos a Meta (bulk upsert)
  const result = await syncAllProductsToMeta({
    catalogId:   catalog_id.trim(),
    accessToken: waConfig.access_token,
    products,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: `Catálogo guardado, pero no se pudo subir productos: ${result.error}` },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    synced:  result.synced,
    message: `${result.synced} producto${result.synced !== 1 ? "s" : ""} subido${result.synced !== 1 ? "s" : ""} a WhatsApp Business`,
  })
}
