// Base de Conocimiento — Server Component

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import KnowledgeDashboard from "./knowledge-dashboard"

export default async function KnowledgePage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) redirect("/login")

  const [
    { data: catalogConfig },
    { data: documents },
    { data: kainoProducts },
    { data: whatsappConfig },
    { data: aiConfig },
  ] = await Promise.all([
    supabase.from("catalog_configs").select("sheet_url, sheet_id, sheet_gid, enabled").eq("tenant_id", tenant.id).maybeSingle(),
    supabase.from("knowledge_documents").select("*").eq("tenant_id", tenant.id).order("created_at"),
    supabase.from("catalog_products").select("id, enabled").eq("tenant_id", tenant.id),
    supabase.from("whatsapp_configs").select("catalog_id, access_token").eq("tenant_id", tenant.id).single(),
    supabase.from("ai_configs").select("*").eq("tenant_id", tenant.id).single(),
  ])

  const kainoActive  = (kainoProducts ?? []).filter(p => p.enabled).length
  const sheetsActive = !!(catalogConfig?.sheet_id && catalogConfig?.enabled !== false)
  const docsActive   = (documents ?? []).filter(d => d.enabled).length

  return (
    <KnowledgeDashboard
      aiConfig={aiConfig}
      catalogConfig={catalogConfig}
      documents={documents ?? []}
      kainoActive={kainoActive}
      sheetsActive={sheetsActive}
      docsActive={docsActive}
      catalogId={whatsappConfig?.catalog_id ?? null}
      isConfigured={!!(whatsappConfig?.access_token)}
    />
  )
}
