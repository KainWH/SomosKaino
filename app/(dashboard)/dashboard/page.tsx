import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessageCircle, Users, Bot, Tag } from "lucide-react"
import MetricCard       from "@/components/MetricCard"
import ConversationList from "@/components/ConversationList"
import ProductList      from "@/components/ProductList"
import QuickActions     from "@/components/QuickActions"

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase.from("tenants").select("id, name").eq("owner_id", user.id).single()
  if (!tenant) return <p className="p-6 text-red-500">Error: no se encontró tu cuenta.</p>

  const today   = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const prevWeekStart = new Date(); prevWeekStart.setDate(prevWeekStart.getDate() - 14)

  const [
    { count: convsToday },
    { count: convsWeek },
    { count: convsPrevWeek },
    { count: leadsToday },
    { count: leadsWeek },
    { count: leadsPrevWeek },
    { count: aiReplies },
    { count: aiPrev },
    { data: waConfig },
    { data: aiConfig },
    { data: conversations },
    { data: products },
    { count: totalProducts },
    { count: pendingOrders },
  ] = await Promise.all([
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("created_at", today.toISOString()),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("created_at", weekAgo.toISOString()),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("created_at", prevWeekStart.toISOString()).lt("created_at", weekAgo.toISOString()),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("created_at", today.toISOString()),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("created_at", weekAgo.toISOString()),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("created_at", prevWeekStart.toISOString()).lt("created_at", weekAgo.toISOString()),
    supabase.from("messages").select("*, conversations!inner(tenant_id)", { count: "exact", head: true })
      .eq("conversations.tenant_id", tenant.id).eq("sent_by_ai", true).eq("direction", "outbound").gte("created_at", weekAgo.toISOString()),
    supabase.from("messages").select("*, conversations!inner(tenant_id)", { count: "exact", head: true })
      .eq("conversations.tenant_id", tenant.id).eq("sent_by_ai", true).eq("direction", "outbound")
      .gte("created_at", prevWeekStart.toISOString()).lt("created_at", weekAgo.toISOString()),
    supabase.from("whatsapp_configs").select("is_configured, phone_display").eq("tenant_id", tenant.id).single(),
    supabase.from("ai_configs").select("enabled").eq("tenant_id", tenant.id).single(),
    supabase.from("conversations")
      .select("id, status, ai_paused, updated_at, contacts(id, name, phone), messages(content, direction, sent_by_ai, created_at)")
      .eq("tenant_id", tenant.id).order("updated_at", { ascending: false }).limit(8),
    supabase.from("catalog_products")
      .select("id, name, price, currency, enabled, image_url")
      .eq("tenant_id", tenant.id).eq("enabled", true).order("name").limit(6),
    supabase.from("catalog_products").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("enabled", true),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "pending"),
  ])

  // Calcular tendencias (evitar división por cero)
  function trend(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  const convsTrend  = trend(convsWeek ?? 0, convsPrevWeek ?? 0)
  const leadsTrend  = trend(leadsWeek ?? 0, leadsPrevWeek ?? 0)
  const aiTrend     = trend(aiReplies ?? 0, aiPrev ?? 0)
  const isSetupDone = waConfig?.is_configured && aiConfig?.enabled

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl">

      {/* ── Alerta setup ── */}
      {!isSetupDone && (
        <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
            <span className="text-lg">⚠️</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Tu agente no está activo</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              {!waConfig?.is_configured ? "Conecta WhatsApp Business para empezar a recibir mensajes." : "Activa el agente de IA en Configuración."}
            </p>
          </div>
          <a href="/settings" className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shrink-0">
            Configurar →
          </a>
        </div>
      )}

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Conversaciones"
          value={convsToday ?? 0}
          sublabel="Hoy"
          trend={{ value: convsTrend, label: "vs semana anterior" }}
          icon={MessageCircle}
          color="blue"
          href="/inbox"
        />
        <MetricCard
          label="Leads nuevos"
          value={leadsToday ?? 0}
          sublabel="Hoy"
          trend={{ value: leadsTrend, label: "vs semana anterior" }}
          icon={Users}
          color="emerald"
          href="/contacts"
        />
        <MetricCard
          label="Respuestas IA"
          value={aiReplies ?? 0}
          sublabel="Esta semana"
          trend={{ value: aiTrend, label: "vs semana anterior" }}
          icon={Bot}
          color="purple"
        />
        <MetricCard
          label="Productos activos"
          value={totalProducts ?? 0}
          sublabel="En catálogo"
          icon={Tag}
          color="amber"
          href="/catalog"
        />
      </div>

      {/* ── Contenido principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Conversaciones — 3/5 */}
        <div className="lg:col-span-3">
          <ConversationList conversations={(conversations ?? []) as any} />
        </div>

        {/* Panel derecho — 2/5 */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <QuickActions pendingOrders={pendingOrders ?? 0} />
          <ProductList products={(products ?? []) as any} />
        </div>

      </div>

    </div>
  )
}
