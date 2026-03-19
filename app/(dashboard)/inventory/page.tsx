import { createClient }       from "@/lib/supabase/server"
import { redirect }            from "next/navigation"
import InventoryDashboard      from "./inventory-dashboard"

export default async function InventoryPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) redirect("/login")

  const [{ data: products }, { data: waConfig }] = await Promise.all([
    supabase
      .from("catalog_products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("whatsapp_configs")
      .select("catalog_id, access_token")
      .eq("tenant_id", tenant.id)
      .single(),
  ])

  const waConnected = !!(waConfig?.catalog_id && waConfig?.access_token)

  return (
    <InventoryDashboard
      products={products ?? []}
      waConnected={waConnected}
    />
  )
}
