"use client"

import { useState, useMemo } from "react"
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import {
  MessageCircle, UserPlus, Brain, Package,
  TrendingUp, MapPin, ShoppingBag, Users, Bot, RefreshCw,
  ChevronRight, Phone, BarChart2, Activity, Star,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

type ActivityRow = {
  day: string
  conversaciones: number
  mensajes: number
  respuestasIA: number
}
type AiSlice    = { name: string; value: number; fill: string }
type Client     = { id: string; name: string; phone: string; convs: number; since: string }
type ProductRow = { name: string; precio: number; currency: string; enabled: boolean }

interface Props {
  activityData:    ActivityRow[]
  aiPerfData:      AiSlice[]
  aiRate:          number
  totalConvs:      number
  totalMsgs:       number
  aiMsgs:          number
  convs7:          number
  msgs7:           number
  topClients:      Client[]
  maxConvs:        number
  productChartData: ProductRow[]
  activeCount:     number
  inactiveCount:   number
  maxPrice:        number
  totalProducts:   number
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[#1f2b49] px-3 py-2.5 text-xs shadow-xl" style={{ background: "#0a1628" }}>
      <p className="text-[#a3aac4] mb-1.5 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#dee5ff]">{p.name}:&nbsp;<strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-[#FF6D00]/10 border border-[#FF6D00]/20 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-[#FF6D00]" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="text-sm font-bold text-[#dee5ff]">{title}</h2>
        <p className="text-[11px] text-[#a3aac4]">{sub}</p>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function ReportsDashboard({
  activityData,
  aiPerfData,
  aiRate,
  totalConvs,
  totalMsgs,
  aiMsgs,
  convs7,
  msgs7,
  topClients,
  maxConvs,
  productChartData,
  activeCount,
  inactiveCount,
  maxPrice,
  totalProducts,
}: Props) {
  const [activityPeriod, setActivityPeriod] = useState<"7" | "30">("30")
  const [activityMetric, setActivityMetric] = useState<"conversaciones" | "mensajes" | "respuestasIA">("conversaciones")

  const displayActivity = useMemo(() => {
    const days = activityPeriod === "7" ? 7 : 30
    return activityData.slice(-days)
  }, [activityData, activityPeriod])

  const humanMsgs = totalMsgs - aiMsgs

  // ── Stats summary cards ─────────────────────────────────────────────────────
  const summaryCards = [
    { label: "Conversaciones", sublabel: "últimos 30 días", value: totalConvs, icon: MessageCircle, color: "text-[#40C4FF]", bg: "bg-[#40C4FF]/10", border: "border-[#40C4FF]/20", accent: "#40C4FF" },
    { label: "Mensajes totales",  sublabel: "últimos 30 días", value: totalMsgs,  icon: Activity,    color: "text-[#FF6D00]", bg: "bg-[#FF6D00]/10", border: "border-[#FF6D00]/20", accent: "#FF6D00" },
    { label: "Respuestas IA",   sublabel: "últimos 30 días", value: aiMsgs,     icon: Brain,       color: "text-[#40C4FF]", bg: "bg-[#40C4FF]/10", border: "border-[#40C4FF]/20", accent: "#40C4FF" },
    { label: "Clientes únicos", sublabel: "registrados",     value: topClients.length, icon: Users, color: "text-[#FF6D00]", bg: "bg-[#FF6D00]/10", border: "border-[#FF6D00]/20", accent: "#FF6D00" },
  ]

  const metricOptions: { key: typeof activityMetric; label: string; color: string }[] = [
    { key: "conversaciones", label: "Conversaciones", color: "#40C4FF" },
    { key: "mensajes",       label: "Mensajes",       color: "#FF6D00" },
    { key: "respuestasIA",   label: "Respuestas IA",  color: "#a3aac4" },
  ]

  const activeMetric = metricOptions.find(m => m.key === activityMetric)!

  return (
    <div className="flex flex-col min-h-full" style={{ background: "linear-gradient(160deg, #060e20 0%, #091328 100%)" }}>
      <div className="px-6 py-8 flex flex-col gap-10">

        {/* ── 1. Summary cards ── */}
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-4">Resumen general</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summaryCards.map(s => (
              <div key={s.label} className={`relative overflow-hidden rounded-xl border ${s.border} p-5 flex flex-col gap-3`} style={{ background: "#0a1628" }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: s.accent }} />
                <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center`}>
                  <s.icon size={15} className={s.color} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#dee5ff] leading-none" style={{ fontFamily: "Manrope, sans-serif" }}>{s.value}</p>
                  <p className="text-xs font-semibold text-[#dee5ff] mt-2">{s.label}</p>
                  <p className="text-[10px] text-[#a3aac4] mt-0.5">{s.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Actividad por período ── */}
        <div className="rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <SectionHeader icon={TrendingUp} title="Actividad por período" sub="Evolución de conversaciones y mensajes" />
            <div className="flex items-center gap-2 flex-wrap">
              {/* Metric selector */}
              <div className="flex items-center gap-1 p-1 rounded-xl border border-[#1f2b49]" style={{ background: "#060e20" }}>
                {metricOptions.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setActivityMetric(m.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      activityMetric === m.key
                        ? "text-white"
                        : "text-[#a3aac4] hover:text-[#dee5ff]"
                    }`}
                    style={activityMetric === m.key ? { background: m.color + "30", color: m.color, border: `1px solid ${m.color}40` } : {}}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {/* Period selector */}
              <div className="flex items-center gap-1 p-1 rounded-xl border border-[#1f2b49]" style={{ background: "#060e20" }}>
                {(["7", "30"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setActivityPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      activityPeriod === p
                        ? "bg-[#FF6D00]/20 text-[#FF6D00] border border-[#FF6D00]/30"
                        : "text-[#a3aac4] hover:text-[#dee5ff]"
                    }`}
                  >
                    {p === "7" ? "7 días" : "30 días"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={displayActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={activeMetric.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2b49" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: "#3a4460", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={activityPeriod === "30" ? 4 : 0}
              />
              <YAxis tick={{ fill: "#3a4460", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area
                type="monotone"
                dataKey={activityMetric}
                stroke={activeMetric.color}
                strokeWidth={2}
                fill="url(#gradActive)"
                dot={false}
                activeDot={{ r: 4, fill: activeMetric.color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Quick stats below chart */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1f2b49]">
            <div className="text-center">
              <p className="text-xl font-bold text-[#dee5ff]">{convs7}</p>
              <p className="text-[10px] text-[#a3aac4] mt-0.5">Conversaciones esta semana</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#dee5ff]">{msgs7}</p>
              <p className="text-[10px] text-[#a3aac4] mt-0.5">Mensajes esta semana</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#FF6D00]">{aiRate}%</p>
              <p className="text-[10px] text-[#a3aac4] mt-0.5">Tasa de automatización</p>
            </div>
          </div>
        </div>

        {/* ── 3. AI + Productos (2 cols) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Rendimiento del Agente IA */}
          <div className="rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
            <SectionHeader icon={Bot} title="Rendimiento del Agente IA" sub="Distribución de respuestas automáticas vs. manuales" />

            {/* Donut */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={aiPerfData}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={64}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {aiPerfData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-[#FF6D00]">{aiRate}%</span>
                  <span className="text-[9px] text-[#a3aac4] font-semibold uppercase tracking-wide">IA</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6D00] shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[#a3aac4]">Respuestas IA</span>
                      <span className="text-xs font-bold text-[#dee5ff]">{aiMsgs}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1f2b49] overflow-hidden">
                      <div className="h-full bg-[#FF6D00] rounded-full transition-all" style={{ width: `${aiRate}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#40C4FF] shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[#a3aac4]">Respuestas manuales</span>
                      <span className="text-xs font-bold text-[#dee5ff]">{humanMsgs}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1f2b49] overflow-hidden">
                      <div className="h-full bg-[#40C4FF] rounded-full transition-all" style={{ width: `${100 - aiRate}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-3 border-t border-[#1f2b49]">
                  <p className="text-[11px] text-[#a3aac4]">Total mensajes procesados</p>
                  <p className="text-xl font-bold text-[#dee5ff] mt-0.5">{totalMsgs.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventario / Rotación */}
          <div className="rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
            <SectionHeader icon={RefreshCw} title="Rotación de inventario" sub="Comparativa de precios y estado de productos" />

            {productChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={productChartData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#1f2b49" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#3a4460", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#3a4460", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="precio" radius={[4, 4, 0, 0]}>
                    {productChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.enabled ? "#FF6D00" : "#1f2b49"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-2">
                <Package size={32} className="text-[#1f2b49]" />
                <p className="text-xs text-[#a3aac4]">Sin productos registrados aún</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1f2b49]">
              <div className="text-center">
                <p className="text-lg font-bold text-[#dee5ff]">{totalProducts}</p>
                <p className="text-[10px] text-[#a3aac4] mt-0.5">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#FF6D00]">{activeCount}</p>
                <p className="text-[10px] text-[#a3aac4] mt-0.5">Activos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#3a4460]">{inactiveCount}</p>
                <p className="text-[10px] text-[#a3aac4] mt-0.5">Inactivos</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Clientes más activos ── */}
        <div className="rounded-xl border border-[#1f2b49] overflow-hidden" style={{ background: "#0a1628" }}>
          <div className="px-6 pt-6 pb-4">
            <SectionHeader icon={Star} title="Clientes más activos" sub="Ranking por número de conversaciones iniciadas" />
          </div>

          {topClients.length > 0 ? (
            <div className="divide-y divide-[#1f2b49]">
              {topClients.map((c, i) => {
                const pct = Math.round((c.convs / maxConvs) * 100)
                return (
                  <div key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#0d1a35] transition-colors">
                    {/* Rank */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      i === 0 ? "bg-[#FF6D00]/20 text-[#FF6D00] border border-[#FF6D00]/30"
                      : i === 1 ? "bg-[#40C4FF]/20 text-[#40C4FF] border border-[#40C4FF]/30"
                      : "bg-[#1f2b49] text-[#a3aac4]"
                    }`}>
                      {i + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: `hsl(${(i * 47) % 360}, 60%, 35%)` }}>
                      {(c.name || "?").slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-[#dee5ff] truncate">{c.name || "Sin nombre"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[#1f2b49] overflow-hidden max-w-[200px]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: i < 3 ? "#FF6D00" : "#40C4FF" }}
                          />
                        </div>
                        <span className="text-[10px] text-[#a3aac4] flex items-center gap-1">
                          <Phone size={9} />
                          {c.phone}
                        </span>
                      </div>
                    </div>

                    {/* Convs count */}
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold ${i < 3 ? "text-[#FF6D00]" : "text-[#dee5ff]"}`}>{c.convs}</p>
                      <p className="text-[9px] text-[#a3aac4]">conversaciones</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center gap-2">
              <Users size={32} className="text-[#1f2b49]" />
              <p className="text-xs text-[#a3aac4]">Sin datos de clientes aún</p>
            </div>
          )}
        </div>

        {/* ── 5. Ventas por zona (placeholder conectado a órdenes) ── */}
        <div className="rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
          <SectionHeader icon={MapPin} title="Ventas por zona" sub="Distribución geográfica de tus pedidos en República Dominicana" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { zone: "Gran SD",    pct: 0, color: "#FF6D00" },
              { zone: "Cibao",      pct: 0, color: "#40C4FF" },
              { zone: "Este",       pct: 0, color: "#FF6D00" },
              { zone: "Sur",        pct: 0, color: "#40C4FF" },
              { zone: "Noroeste",   pct: 0, color: "#FF6D00" },
              { zone: "Nordeste",   pct: 0, color: "#40C4FF" },
            ].map(z => (
              <div key={z.zone} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#1f2b49]" style={{ background: "#060e20" }}>
                <div className="relative w-12 h-12">
                  <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#1f2b49" strokeWidth="4" />
                    <circle
                      cx="18" cy="18" r="14"
                      fill="none"
                      stroke={z.color}
                      strokeWidth="4"
                      strokeDasharray={`${z.pct * 0.88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#dee5ff]">{z.pct}%</span>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-[#a3aac4] text-center">{z.zone}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#1f2b49]/60 bg-[#FF6D00]/5">
            <ShoppingBag size={13} className="text-[#FF6D00] shrink-0" />
            <p className="text-xs text-[#a3aac4]">
              Las zonas se poblarán automáticamente cuando conectes el módulo de Pedidos.
            </p>
          </div>
        </div>

        {/* ── 6. Productos más vendidos ── */}
        <div className="rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
          <SectionHeader icon={ShoppingBag} title="Productos más vendidos" sub="Ranking por precio · se actualizará con datos de pedidos" />

          {productChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                layout="vertical"
                data={productChartData}
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid stroke="#1f2b49" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#3a4460", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#a3aac4", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="precio" radius={[0, 4, 4, 0]}>
                  {productChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.enabled ? "#FF6D00" : "#2a3a5c"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <Package size={32} className="text-[#1f2b49]" />
              <p className="text-xs text-[#a3aac4]">Sin productos registrados</p>
            </div>
          )}
        </div>

        {/* ── 7. Feedback ── */}
        <div className="rounded-xl border border-[#1f2b49] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5" style={{ background: "#0a1628" }}>
          <div className="flex-1">
            <p className="text-[10px] font-semibold tracking-[0.15em] text-[#FF6D00] uppercase mb-1.5">Feedback</p>
            <p className="text-base font-bold text-[#dee5ff]">¿Qué otras métricas necesitas?</p>
            <p className="text-xs text-[#a3aac4] mt-1.5 leading-relaxed">
              Cuéntanos qué datos son más valiosos para tu negocio y los priorizamos en el roadmap.
            </p>
          </div>
          <a
            href="mailto:soporte@somoskaino.com?subject=Sugerencia%20de%20métrica"
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#FF6D00]/40 text-sm font-semibold text-[#FF6D00] hover:bg-[#FF6D00]/10 transition-all hover:scale-[1.02] active:scale-100"
          >
            Sugerir métrica
            <ChevronRight size={14} />
          </a>
        </div>

      </div>
    </div>
  )
}
