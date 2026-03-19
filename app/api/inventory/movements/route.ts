import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, code, product, sku, units, total, status, city, created_at")
      .eq("tenant_id", tenant.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("catalog_products")
      .select("id, name, category, created_at, updated_at")
      .eq("tenant_id", tenant.id)
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(10),
  ])

  type Movement = {
    id:         string
    type:       "order_pending" | "order_completed" | "product_new" | "product_updated"
    title:      string
    sub:        string
    location:   string
    badge:      string
    created_at: string
  }

  const movements: Movement[] = []

  for (const o of orders ?? []) {
    const label = o.code ? `ORD-${o.code}` : o.product?.slice(0, 20) ?? "Pedido"
    const isCompleted = o.status === "completed" || o.status === "delivered"
    movements.push({
      id:         `order_${o.id}`,
      type:       isCompleted ? "order_completed" : "order_pending",
      title:      isCompleted ? `Venta Realizada — ${label}` : `Pedido recibido — ${label}`,
      sub:        `${o.units} unidad${o.units !== 1 ? "es" : ""}`,
      location:   o.city || "—",
      badge:      `-${o.units}`,
      created_at: o.created_at,
    })
  }

  for (const p of products ?? []) {
    const isNew = p.created_at === p.updated_at ||
      Math.abs(new Date(p.created_at).getTime() - new Date(p.updated_at).getTime()) < 5000
    const ref = `SKU-${p.id.slice(0, 4).toUpperCase()}`
    movements.push({
      id:         `product_${p.id}`,
      type:       isNew ? "product_new" : "product_updated",
      title:      isNew ? `Nuevo producto — ${ref}` : `Actualización — ${ref}`,
      sub:        p.name ?? "",
      location:   p.category ?? "Catálogo",
      badge:      isNew ? "+1 SKU" : "✓",
      created_at: p.updated_at,
    })
  }

  movements.sort((a, b) => b.created_at.localeCompare(a.created_at))

  return NextResponse.json(movements.slice(0, 8))
}
