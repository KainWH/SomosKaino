import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchCatalogProducts } from "@/lib/whatsapp-catalog"

// POST — guardar catalog_id y sincronizar productos desde Meta API
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { catalog_id } = await request.json()

  // Necesitamos el access_token de WhatsApp para consultar Meta API
  const { data: waConfig } = await supabase
    .from("whatsapp_configs")
    .select("access_token")
    .eq("tenant_id", tenant.id)
    .single()

  if (!waConfig?.access_token) {
    return NextResponse.json(
      { error: "Primero configura tu token de acceso de WhatsApp en Configuración" },
      { status: 400 }
    )
  }

  // Guardar el catalog_id (o null para desconectar)
  const { error: saveError } = await supabase
    .from("whatsapp_configs")
    .update({ catalog_id: catalog_id?.trim() || null })
    .eq("tenant_id", tenant.id)

  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

  if (!catalog_id?.trim()) {
    return NextResponse.json({ success: true, products: [], count: 0 })
  }

  // Obtener productos del catálogo de Meta
  const { products, error: fetchError } = await fetchCatalogProducts(
    catalog_id.trim(),
    waConfig.access_token
  )

  if (fetchError) {
    return NextResponse.json(
      { error: `No se pudo acceder al catálogo: ${fetchError}` },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, products, count: products.length })
}
