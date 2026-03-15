// Configuración — Server Component
// Carga los datos actuales de Supabase y los pasa a los formularios

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import WhatsappForm from "./whatsapp-form"
import AiForm from "./ai-form"
import CatalogForm from "./catalog-form"

export default async function SettingsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Obtener el tenant del usuario
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) redirect("/login")

  // Cargar configuraciones actuales en paralelo
  const [{ data: whatsappConfig }, { data: aiConfig }, { data: catalogConfig }] = await Promise.all([
    supabase
      .from("whatsapp_configs")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single(),
    supabase
      .from("ai_configs")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single(),
    supabase
      .from("catalog_configs")
      .select("sheet_url, sheet_id, sheet_gid")
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
  ])

  return (
    <div className="flex-1 overflow-auto p-6">
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm">Conecta WhatsApp y personaliza tu IA</p>
      </div>

      <WhatsappForm config={whatsappConfig} />
      <AiForm config={aiConfig} />
      <CatalogForm config={catalogConfig} />
    </div>
    </div>
  )
}
