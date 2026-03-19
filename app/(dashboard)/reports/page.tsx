import { createClient } from "@/lib/supabase/server"
import { redirect }     from "next/navigation"
import ReportsDashboard from "./reports-dashboard"

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("owner_id", user.id)
    .single()
  if (!tenant) redirect("/login")

  const now          = new Date()
  const days30Ago    = new Date(now); days30Ago.setDate(now.getDate() - 30)
  const days7Ago     = new Date(now); days7Ago.setDate(now.getDate() - 7)

  // ── Parallel fetches ────────────────────────────────────────────────────────
  const [
    { data: convs30 },
    { data: messages30 },
    { data: contacts },
    { data: products },
  ] = await Promise.all([
    // All conversations last 30 days
    supabase
      .from("conversations")
      .select("id, created_at, contact_id")
      .eq("tenant_id", tenant.id)
      .gte("created_at", days30Ago.toISOString())
      .order("created_at", { ascending: true }),

    // All messages last 30 days (with ai flag)
    supabase
      .from("messages")
      .select("id, sent_by_ai, created_at, conversations!inner(tenant_id)")
      .eq("conversations.tenant_id", tenant.id)
      .gte("created_at", days30Ago.toISOString())
      .order("created_at", { ascending: true }),

    // Contacts with conversation count
    supabase
      .from("contacts")
      .select("id, name, phone, created_at, conversations(count)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(50),

    // Catalog products
    supabase
      .from("catalog_products")
      .select("id, name, price, currency, enabled, created_at")
      .eq("tenant_id", tenant.id)
      .order("price", { ascending: false }),
  ])

  // ── Activity chart data (last 30 days, grouped by day) ──────────────────────
  const build30Days = () => {
    const days: string[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }
  const allDays = build30Days()

  const convsByDay = (convs30 ?? []).reduce<Record<string, number>>((acc, c) => {
    const day = c.created_at.slice(0, 10)
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  const msgsByDay = (messages30 ?? []).reduce<Record<string, number>>((acc, m) => {
    const day = m.created_at.slice(0, 10)
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  const aiMsgsByDay = (messages30 ?? []).filter(m => m.sent_by_ai).reduce<Record<string, number>>((acc, m) => {
    const day = m.created_at.slice(0, 10)
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  const activityData = allDays.map(day => {
    const d = new Date(day)
    const label = d.toLocaleDateString("es-DO", { day: "numeric", month: "short" })
    return {
      day: label,
      conversaciones: convsByDay[day] || 0,
      mensajes:        msgsByDay[day]  || 0,
      respuestasIA:    aiMsgsByDay[day] || 0,
    }
  })

  // ── AI performance stats ────────────────────────────────────────────────────
  const totalMsgs   = (messages30 ?? []).length
  const aiMsgs      = (messages30 ?? []).filter(m => m.sent_by_ai).length
  const humanMsgs   = totalMsgs - aiMsgs
  const aiRate      = totalMsgs > 0 ? Math.round((aiMsgs / totalMsgs) * 100) : 0
  const totalConvs  = (convs30 ?? []).length

  // 7-day window for "this week" comparison
  const convs7   = (convs30 ?? []).filter(c => c.created_at >= days7Ago.toISOString()).length
  const msgs7    = (messages30 ?? []).filter(m => m.created_at >= days7Ago.toISOString()).length

  const aiPerfData = [
    { name: "IA",    value: aiMsgs,    fill: "#FF6D00" },
    { name: "Human", value: humanMsgs, fill: "#40C4FF" },
  ]

  // ── Top clients ─────────────────────────────────────────────────────────────
  const topClients = (contacts ?? [])
    .map(c => ({
      id:     c.id,
      name:   c.name || c.phone,
      phone:  c.phone,
      convs:  (c.conversations as any[])?.[0]?.count ?? 0,
      since:  c.created_at,
    }))
    .sort((a, b) => b.convs - a.convs)
    .slice(0, 10)

  const maxConvs = Math.max(1, ...topClients.map(c => c.convs))

  // ── Products ─────────────────────────────────────────────────────────────────
  const activeProducts   = (products ?? []).filter(p => p.enabled)
  const inactiveProducts = (products ?? []).filter(p => !p.enabled)
  const maxPrice         = Math.max(1, ...(products ?? []).map(p => p.price ?? 0))

  const productChartData = (products ?? [])
    .filter(p => p.price != null)
    .slice(0, 8)
    .map(p => ({
      name:    p.name.length > 16 ? p.name.slice(0, 14) + "…" : p.name,
      precio:  p.price ?? 0,
      currency: p.currency,
      enabled: p.enabled,
    }))

  return (
    <ReportsDashboard
      activityData={activityData}
      aiPerfData={aiPerfData}
      aiRate={aiRate}
      totalConvs={totalConvs}
      totalMsgs={totalMsgs}
      aiMsgs={aiMsgs}
      convs7={convs7}
      msgs7={msgs7}
      topClients={topClients}
      maxConvs={maxConvs}
      productChartData={productChartData}
      activeCount={activeProducts.length}
      inactiveCount={inactiveProducts.length}
      maxPrice={maxPrice}
      totalProducts={(products ?? []).length}
    />
  )
}
