// Dashboard principal — Server Component

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) {
    return <p className="p-6 text-red-500">Error: no se encontró tu cuenta. Contacta soporte.</p>
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  // Cargar todo en paralelo
  const [
    { count: conversationsToday },
    { count: leadsToday },
    { count: aiReplies },
    { data: waConfig },
    { data: aiConfig },
    { data: catalogCount },
    { data: sheetsConfig },
    { data: docsCount },
  ] = await Promise.all([
    supabase.from("conversations").select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id).gte("created_at", todayISO),
    supabase.from("contacts").select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id).gte("created_at", todayISO),
    supabase.from("messages")
      .select("*, conversations!inner(tenant_id)", { count: "exact", head: true })
      .eq("conversations.tenant_id", tenant.id)
      .eq("sent_by_ai", true).eq("direction", "outbound").gte("created_at", todayISO),
    supabase.from("whatsapp_configs")
      .select("is_configured, phone_display").eq("tenant_id", tenant.id).single(),
    supabase.from("ai_configs")
      .select("enabled, system_prompt").eq("tenant_id", tenant.id).single(),
    supabase.from("catalog_products")
      .select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("enabled", true),
    supabase.from("catalog_configs")
      .select("sheet_id, enabled").eq("tenant_id", tenant.id).maybeSingle(),
    supabase.from("knowledge_documents")
      .select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("enabled", true),
  ])

  // Estado de cada paso del setup
  const step1 = true  // siempre done: cuenta creada
  const step2 = !!(waConfig?.is_configured)
  const step3 = !!(aiConfig?.enabled && aiConfig?.system_prompt &&
    aiConfig.system_prompt !== "Eres un asistente amigable de bienes raíces.\nResponde de forma breve y profesional.\nCuando el lead muestre interés en una propiedad, pide su nombre y cuándo puede agendar una cita.")
  const step4 = !!((catalogCount ?? 0) > 0 || (sheetsConfig?.sheet_id && sheetsConfig?.enabled !== false) || (docsCount ?? 0) > 0)

  const allDone    = step2 && step3 && step4
  const stepsLeft  = [step2, step3, step4].filter(s => !s).length

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex flex-col gap-6 max-w-3xl">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {allDone ? "Dashboard" : `Hola, ${tenant.name} 👋`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {allDone
              ? "Resumen de tu actividad de hoy"
              : stepsLeft === 1
                ? "Un paso más y tu agente estará listo"
                : `Completa ${stepsLeft} pasos para activar tu agente de WhatsApp`}
          </p>
        </div>

        {/* ── CHECKLIST DE SETUP (mientras no esté todo listo) ── */}
        {!allDone && (
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Configuración inicial</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {3 - stepsLeft} de 3 pasos completados
                </p>
              </div>
              {/* Barra de progreso */}
              <div className="w-28 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round(((3 - stepsLeft) / 3) * 100)}%` }}
                />
              </div>
            </div>

            <div className="divide-y">

              {/* Paso 1 — Cuenta creada */}
              <SetupStep
                done={true}
                icon="✅"
                title="Cuenta creada"
                description="Tu cuenta de RentIA está lista"
              />

              {/* Paso 2 — WhatsApp Business */}
              <SetupStep
                done={step2}
                icon="💬"
                title="Conectar WhatsApp Business"
                description={step2
                  ? `Conectado${waConfig?.phone_display ? ` — ${waConfig.phone_display}` : ""}`
                  : "Necesitas un número de WhatsApp Business de Meta para recibir mensajes"}
                cta={!step2 ? { label: "Conectar ahora", href: "/settings" } : undefined}
              />

              {/* Paso 3 — Personalizar IA */}
              <SetupStep
                done={step3}
                icon="🤖"
                title="Personalizar el agente de IA"
                description={step3
                  ? "Tu agente tiene instrucciones personalizadas"
                  : "Define cómo se presenta tu agente, qué puede y no puede decir"}
                cta={!step3 ? { label: "Personalizar", href: "/settings#ai" } : undefined}
              />

              {/* Paso 4 — Conocimiento */}
              <SetupStep
                done={step4}
                icon="🧠"
                title="Agregar conocimiento"
                description={step4
                  ? `Fuentes activas: ${[
                      (catalogCount ?? 0) > 0 && `${catalogCount} productos`,
                      (sheetsConfig?.sheet_id && sheetsConfig?.enabled !== false) && "spreadsheet",
                      (docsCount ?? 0) > 0 && `${docsCount} documentos`,
                    ].filter(Boolean).join(", ")}`
                  : "Agrega tu catálogo, un spreadsheet o documentos para que el agente pueda responder"}
                cta={!step4 ? { label: "Ir a Conocimiento", href: "/knowledge" } : undefined}
                ctaSecondary={!step4 ? { label: "Ver catálogo", href: "/catalog" } : undefined}
              />

            </div>
          </div>
        )}

        {/* ── Si WhatsApp no está conectado: instrucciones rápidas ── */}
        {!step2 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-3">¿Cómo conectar WhatsApp Business?</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <span className="font-bold shrink-0">1.</span>
                <span>Ve a <strong>developers.facebook.com</strong> y crea una app de tipo <strong>Business</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0">2.</span>
                <span>Agrega el producto <strong>WhatsApp</strong> a tu app</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0">3.</span>
                <span>En <strong>API Setup</strong> copia el <em>Phone Number ID</em> y el <em>Access Token</em></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0">4.</span>
                <span>Pégalos en <a href="/settings" className="underline font-semibold">Configuración → WhatsApp Business</a></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0">5.</span>
                <span>Configura el webhook de Meta apuntando a: <code className="bg-blue-100 px-1 rounded text-xs">/api/webhook/whatsapp</code></span>
              </li>
            </ol>
          </div>
        )}

        {/* ── MÉTRICAS (siempre visibles) ── */}
        {allDone && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Conversaciones hoy" value={conversationsToday ?? 0} icon="💬" />
            <MetricCard label="Leads nuevos"        value={leadsToday ?? 0}         icon="👤" />
            <MetricCard label="Respuestas con IA"   value={aiReplies ?? 0}          icon="🤖" />
          </div>
        )}

        {/* Métricas pequeñas si setup en progreso */}
        {!allDone && (conversationsToday ?? 0) + (leadsToday ?? 0) > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <SmallMetric label="Conversaciones hoy" value={conversationsToday ?? 0} />
            <SmallMetric label="Leads nuevos"        value={leadsToday ?? 0} />
            <SmallMetric label="Respuestas IA"       value={aiReplies ?? 0} />
          </div>
        )}

      </div>
    </div>
  )
}

// ── Componentes ──

function SetupStep({
  done, icon, title, description, cta, ctaSecondary,
}: {
  done:           boolean
  icon:           string
  title:          string
  description:    string
  cta?:           { label: string; href: string }
  ctaSecondary?:  { label: string; href: string }
}) {
  return (
    <div className={`flex items-start gap-4 p-5 ${done ? "opacity-60" : ""}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${
        done ? "bg-green-100" : "bg-gray-100"
      }`}>
        {done ? "✅" : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${done ? "text-gray-500 line-through" : "text-gray-900"}`}>
          {title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        {(cta || ctaSecondary) && (
          <div className="flex gap-2 mt-2">
            {cta && (
              <a
                href={cta.href}
                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800"
              >
                {cta.label} →
              </a>
            )}
            {ctaSecondary && (
              <a
                href={ctaSecondary.href}
                className="text-xs border text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                {ctaSecondary.label}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded-xl p-3 text-center">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
