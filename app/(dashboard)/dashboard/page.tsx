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
    <div className="flex flex-col h-full">

      {/* Header fijo */}
      <div className="px-6 h-14 flex items-center border-b border-gray-100 bg-white shrink-0">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900">
            {allDone ? "Dashboard" : `Hola, ${tenant.name} 👋`}
          </h1>
          <p className="text-[11px] text-gray-400 leading-none mt-0.5">
            {allDone
              ? "Resumen de tu actividad de hoy"
              : stepsLeft === 1
                ? "Un paso más y tu agente estará listo"
                : `Completa ${stepsLeft} pasos para activar tu agente`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
      <div className="flex flex-col gap-6 max-w-3xl">

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

        {/* ── MÉTRICAS ── */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="Conversaciones"
            sublabel="hoy"
            value={conversationsToday ?? 0}
            color="blue"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
          />
          <MetricCard
            label="Leads nuevos"
            sublabel="hoy"
            value={leadsToday ?? 0}
            color="green"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
          />
          <MetricCard
            label="Respuestas IA"
            sublabel="hoy"
            value={aiReplies ?? 0}
            color="purple"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M12 2a7 7 0 017 7c0 3.5-2.5 5.5-3 8H8c-.5-2.5-3-4.5-3-8a7 7 0 017-7z"/><path d="M9 21h6M10 17h4"/></svg>}
          />
        </div>

      </div>
      </div>
    </div>
  )
}

// ── Componentes ──

function SetupStep({
  done, title, description, cta, ctaSecondary,
}: {
  done:           boolean
  icon?:          string
  title:          string
  description:    string
  cta?:           { label: string; href: string }
  ctaSecondary?:  { label: string; href: string }
}) {
  return (
    <div className={`flex items-start gap-4 p-5 transition-opacity ${done ? "opacity-50" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
        done ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
      }`}>
        {done ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-green-600">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${done ? "text-gray-400" : "text-gray-900"}`}>
          {title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        {(cta || ctaSecondary) && (
          <div className="flex gap-2 mt-3">
            {cta && (
              <a href={cta.href} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                {cta.label} →
              </a>
            )}
            {ctaSecondary && (
              <a href={ctaSecondary.href} className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                {ctaSecondary.label}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const metricColors = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-500",   value: "text-blue-700" },
  green:  { bg: "bg-green-50",  icon: "text-green-500",  value: "text-green-700" },
  purple: { bg: "bg-purple-50", icon: "text-purple-500", value: "text-purple-700" },
} as const

function MetricCard({ label, sublabel, value, icon, color }: {
  label:    string
  sublabel: string
  value:    number
  icon:     React.ReactNode
  color:    keyof typeof metricColors
}) {
  const c = metricColors[color]
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.icon} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label} <span className="text-gray-400 text-xs">/ {sublabel}</span></p>
      </div>
    </div>
  )
}
