// Base de Conocimiento — Server Component
// Las 3 fuentes de información del agente de IA

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SheetsSource from "./sheets-source"
import DocumentsSource from "./documents-source"
import WhatsappCatalogSource from "./whatsapp-catalog-source"

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
    { data: rentiaProducts },
    { data: whatsappConfig },
  ] = await Promise.all([
    supabase
      .from("catalog_configs")
      .select("sheet_url, sheet_id, sheet_gid, enabled")
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    supabase
      .from("knowledge_documents")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at"),
    supabase
      .from("catalog_products")
      .select("id, enabled")
      .eq("tenant_id", tenant.id),
    supabase
      .from("whatsapp_configs")
      .select("catalog_id, access_token")
      .eq("tenant_id", tenant.id)
      .single(),
  ])

  const rentiaActive = (rentiaProducts ?? []).filter(p => p.enabled).length
  const sheetsActive = !!(catalogConfig?.sheet_id && catalogConfig?.enabled !== false)
  const docsActive   = (documents ?? []).filter(d => d.enabled).length
  const totalActive  = [rentiaActive > 0, sheetsActive, docsActive > 0].filter(Boolean).length

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h1>
          <p className="text-gray-500 text-sm mt-1">
            El agente responde usando estas 3 fuentes. Activa las que necesites.
          </p>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-3">
          <a href="/catalog" className={`border rounded-xl p-4 text-center hover:shadow-sm transition-shadow ${rentiaActive > 0 ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
            <p className="text-2xl mb-1">📦</p>
            <p className="text-xs font-medium text-gray-700">Catálogo</p>
            <p className={`text-xs mt-0.5 ${rentiaActive > 0 ? "text-green-600 font-medium" : "text-gray-400"}`}>
              {rentiaActive > 0 ? `${rentiaActive} producto${rentiaActive > 1 ? "s" : ""}` : "Sin productos"}
            </p>
          </a>
          <div className={`border rounded-xl p-4 text-center ${sheetsActive ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
            <p className="text-2xl mb-1">📊</p>
            <p className="text-xs font-medium text-gray-700">Spreadsheet</p>
            <p className={`text-xs mt-0.5 ${sheetsActive ? "text-green-600 font-medium" : "text-gray-400"}`}>
              {sheetsActive ? "Conectado" : "Sin conectar"}
            </p>
          </div>
          <div className={`border rounded-xl p-4 text-center ${docsActive > 0 ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
            <p className="text-2xl mb-1">📄</p>
            <p className="text-xs font-medium text-gray-700">Documentos</p>
            <p className={`text-xs mt-0.5 ${docsActive > 0 ? "text-green-600 font-medium" : "text-gray-400"}`}>
              {docsActive > 0 ? `${docsActive} activo${docsActive > 1 ? "s" : ""}` : "Sin documentos"}
            </p>
          </div>
        </div>

        {totalActive === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            El agente no tiene ninguna fuente activa. Agrega productos al catálogo, conecta un spreadsheet o sube un documento.
          </div>
        )}

        {/* ── Fuente 1: Catálogo RentIA ── */}
        <section className="bg-white border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-lg">📦</div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Catálogo de Productos</h2>
                <p className="text-xs text-gray-500">Productos con foto, precio y descripción creados en RentIA</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              rentiaActive > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"
            }`}>
              {rentiaActive > 0 ? `${rentiaActive} activo${rentiaActive > 1 ? "s" : ""}` : "Vacío"}
            </span>
          </div>
          <div className="p-5">
            {rentiaActive > 0 ? (
              <p className="text-sm text-gray-600 mb-3">
                El agente conoce {rentiaActive} producto{rentiaActive > 1 ? "s" : ""} y puede enviar sus fotos automáticamente por WhatsApp.
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-3">
                Aún no tienes productos. Crea tu catálogo y el agente podrá responder preguntas y enviar fotos.
              </p>
            )}
            <a
              href="/catalog"
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              {rentiaActive > 0 ? "Gestionar catálogo" : "Crear primer producto"} →
            </a>
          </div>
        </section>

        {/* ── Fuente 2: Google Sheets ── */}
        <SheetsSource config={catalogConfig} />

        {/* ── Fuente 3: Documentos ── */}
        <DocumentsSource documents={documents ?? []} />

        {/* ── Publicación en WhatsApp Business (no es fuente, es destino) ── */}
        <div className="border-t pt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Distribución
          </p>
          <WhatsappCatalogSource
            catalogId={whatsappConfig?.catalog_id ?? null}
            isConfigured={!!(whatsappConfig?.access_token)}
            rentiaCount={rentiaActive}
          />
        </div>

      </div>
    </div>
  )
}
