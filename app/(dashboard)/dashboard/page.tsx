import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessageCircle, Users, Bot, ShoppingCart } from "lucide-react"
import MetricCard       from "@/components/MetricCard"
import ConversationList from "@/components/ConversationList"
import RecentMovements  from "@/components/RecentMovements"
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

  // Sparklines: [semana anterior, semana actual] como tendencia visual
  const convsSparkline  = [convsPrevWeek ?? 0, convsWeek ?? 0]
  const leadsSparkline  = [leadsPrevWeek ?? 0, leadsWeek ?? 0]
  const aiSparkline     = [aiPrev ?? 0, aiReplies ?? 0]
  const ordersSparkline = [0, pendingOrders ?? 0]

  return (
    <div className="flex flex-col lg:h-full lg:overflow-hidden">

      {/* ── Alerta setup ── */}
      {!isSetupDone && (
        <div className="mx-6 mt-6 flex items-center gap-4 bg-[#FF6D00]/10 border border-[#FF6D00]/30 rounded-2xl p-4 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#FF6D00]/15 flex items-center justify-center shrink-0">
            <span>⚠️</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#FF6D00]">Tu agente no está activo</p>
            <p className="text-xs text-[#FF6D00]/70 mt-0.5">
              {!waConfig?.is_configured ? "Conecta WhatsApp Business para empezar a recibir mensajes." : "Activa el agente de IA en Configuración."}
            </p>
          </div>
          <a href="/settings" className="text-xs bg-[#FF6D00] hover:bg-[#e86200] text-white px-4 py-2 rounded-xl font-medium transition-colors shrink-0">
            Configurar →
          </a>
        </div>
      )}

      {/* ── Métricas ── */}
      <div className="px-6 pt-6 pb-0 grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <MetricCard
          label="Conversaciones"
          value={convsToday ?? 0}
          sublabel="Hoy"
          trend={{ value: convsTrend, label: "vs semana anterior" }}
          sparkline={convsSparkline}
          icon={MessageCircle}
          color="blue"
          href="/inbox"
        />
        <MetricCard
          label="Leads nuevos"
          value={leadsToday ?? 0}
          sublabel="Hoy"
          trend={{ value: leadsTrend, label: "vs semana anterior" }}
          sparkline={leadsSparkline}
          icon={Users}
          color="teal"
          href="/contacts"
        />
        <MetricCard
          label="Respuestas IA"
          value={aiReplies ?? 0}
          sublabel="Esta semana"
          trend={{ value: aiTrend, label: "vs semana anterior" }}
          sparkline={aiSparkline}
          icon={Bot}
          color="purple"
        />
        <MetricCard
          label="Pedidos pendientes"
          value={pendingOrders ?? 0}
          sublabel="Sin gestionar"
          sparkline={ordersSparkline}
          icon={ShoppingCart}
          color="orange"
          href="/orders"
        />
      </div>

      {/* ── Contenido principal — ocupa todo el resto ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-5 p-6">

        {/* Chat — 3/5 */}
        <div className="lg:col-span-3 min-h-0 overflow-hidden">
          <ConversationList conversations={(conversations ?? []) as any} tenantId={tenant.id} />
        </div>

        {/* Panel derecho — 2/5 */}
        <div className="lg:col-span-2 min-h-0 grid gap-5" style={{ gridTemplateRows: "auto 1fr" }}>
          <QuickActions />
          <div className="min-h-0 overflow-hidden">
            <RecentMovements />
          </div>
        </div>

      </div>
    </div>
  )
}
