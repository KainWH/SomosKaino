// Configuración — Server Component

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SettingsDashboard from "./settings-dashboard"

export default async function SettingsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) redirect("/login")

  const { data: whatsappConfig } = await supabase
    .from("whatsapp_configs")
    .select("id, tenant_id, phone_number_id, phone_display, is_configured, created_at, updated_at")
    .eq("tenant_id", tenant.id)
    .single()

  return (
    <SettingsDashboard
      whatsappConfig={whatsappConfig}
      tenantName={tenant.name ?? ""}
    />
  )
}
