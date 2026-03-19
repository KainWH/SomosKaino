import { createClient } from "@/lib/supabase/server"
import { redirect }     from "next/navigation"
import OrdersDashboard  from "./orders-dashboard"

export default async function OrdersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) redirect("/login")

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  return <OrdersDashboard initialOrders={orders ?? []} />
}
