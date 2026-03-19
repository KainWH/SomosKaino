"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2, Truck, Globe, TrendingUp,
  CheckCircle2, ChevronRight, Activity,
  Plus, X, Package, MapPin, User, Hash, Phone, DollarSign,
  ShoppingBag, Home, Trash2, ChevronDown, Filter,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

export type OrderStatus = "active" | "idle" | "pending" | "delivered"

export interface Order {
  id:             string
  code:           string
  city:           string
  agency:         string
  client_name:    string
  client_phone:   string
  client_address: string
  product:        string
  sku:            string
  unit_price:     number
  units:          number
  total:          number
  status:         OrderStatus
  created_at:     string
}

type Period = "semana" | "mes"

// ── Helpers ────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-[#060e20] border border-[#1f2b49] text-sm text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:border-[#FF6D00]/50 focus:ring-2 focus:ring-[#FF6D00]/10 transition-all"

const STATUS_META: Record<OrderStatus, { label: string; color: string; dot: string; bg: string; border: string }> = {
  active:    { label: "Activo",    color: "text-[#FF6D00]",  dot: "bg-[#FF6D00]",  bg: "bg-[#FF6D00]/10",  border: "border-[#FF6D00]/25"  },
  pending:   { label: "Nuevo",     color: "text-[#40C4FF]",  dot: "bg-[#40C4FF]",  bg: "bg-[#40C4FF]/10",  border: "border-[#40C4FF]/25"  },
  delivered: { label: "Entregado", color: "text-[#40C4FF]",  dot: "bg-[#40C4FF]",  bg: "bg-[#40C4FF]/10",  border: "border-[#40C4FF]/25"  },
  idle:      { label: "Pausado",   color: "text-[#3a4460]",  dot: "bg-[#3a4460]",  bg: "bg-[#3a4460]/10",  border: "border-[#3a4460]/25"  },
}

function StatusDot({ status }: { status: OrderStatus }) {
  const { dot } = STATUS_META[status]
  const ping = status !== "idle"
  return (
    <span className="relative flex h-2.5 w-2.5">
      {ping && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dot}`} />
    </span>
  )
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold tracking-[0.12em] text-[#a3aac4] uppercase flex items-center gap-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  )
}

// ── Shipment Chart ─────────────────────────────────────────────────────────────

function ShipmentChart({ orders }: { orders: Order[] }) {
  const [period, setPeriod] = useState<Period>("semana")

  const { bars, stats } = useMemo(() => {
    const now = new Date()

    if (period === "semana") {
      const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      const counts = Array(7).fill(0)
      const revenue = Array(7).fill(0)
      orders.forEach(o => {
        const d = new Date(o.created_at)
        const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
        if (diff < 7) { counts[d.getDay()]++; revenue[d.getDay()] += o.total }
      })
      const total = counts.reduce((a, b) => a + b, 0)
      const rev   = revenue.reduce((a, b) => a + b, 0)
      return {
        bars:  labels.map((label, i) => ({ label, val: counts[i] })),
        stats: { pedidos: total, revenue: rev },
      }
    } else {
      const labels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
      const counts  = Array(12).fill(0)
      const revenue = Array(12).fill(0)
      orders.forEach(o => {
        const d = new Date(o.created_at)
        if (d.getFullYear() === now.getFullYear()) {
          counts[d.getMonth()]++
          revenue[d.getMonth()] += o.total
        }
      })
      const total = counts.reduce((a, b) => a + b, 0)
      const rev   = revenue.reduce((a, b) => a + b, 0)
      return {
        bars:  labels.map((label, i) => ({ label, val: counts[i] })),
        stats: { pedidos: total, revenue: rev },
      }
    }
  }, [orders, period])

  const max = Math.max(1, ...bars.map(b => b.val))

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase">Resumen de Envíos</p>
          <p className="text-xs text-[#a3aac4] mt-0.5">Pedidos registrados por período</p>
        </div>
        <div className="flex gap-1 bg-[#0d1a35] border border-[#1f2b49] rounded-lg p-1">
          {(["semana", "mes"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${
                period === p ? "bg-[#FF6D00] text-white shadow-sm" : "text-[#a3aac4] hover:text-[#dee5ff]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-[#1f2b49] px-4 py-3" style={{ background: "#0d1a35" }}>
          <p className="text-[10px] text-[#a3aac4] uppercase tracking-widest mb-1">Pedidos</p>
          <p className="text-xl font-light text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>{stats.pedidos}</p>
        </div>
        <div className="rounded-lg border border-[#1f2b49] px-4 py-3" style={{ background: "#0d1a35" }}>
          <p className="text-[10px] text-[#a3aac4] uppercase tracking-widest mb-1">Revenue</p>
          <p className="text-xl font-light text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>${stats.revenue.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-[#FF6D00]/20 bg-[#FF6D00]/5 px-4 py-3">
          <p className="text-[10px] text-[#a3aac4] uppercase tracking-widest mb-1">Período</p>
          <p className="text-xs font-semibold text-[#FF6D00] capitalize">{period === "semana" ? "Esta semana" : "Este año"}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-end gap-2 h-20"
        >
          {bars.map((b, i) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5">
              <motion.div
                className="w-full rounded-sm"
                initial={{ height: 0 }}
                animate={{ height: `${Math.round((b.val / max) * 100)}%` }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                style={{
                  minHeight: b.val > 0 ? 4 : 0,
                  background: b.val > 0
                    ? "linear-gradient(180deg, #FF6D00, #e86200)"
                    : "linear-gradient(180deg, #40C4FF33, #40C4FF11)",
                }}
              />
              <span className="text-[9px] text-[#3a4460] whitespace-nowrap">{b.label}</span>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Status Selector ────────────────────────────────────────────────────────────

function StatusSelector({ current, onChange }: { current: OrderStatus; onChange: (s: OrderStatus) => void }) {
  const [open, setOpen] = useState(false)
  const meta = STATUS_META[current]
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${meta.bg} ${meta.border} ${meta.color}`}
      >
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        {meta.label}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-20 rounded-xl border border-[#1f2b49] overflow-hidden shadow-xl w-36" style={{ background: "#0a1628" }}>
          {(Object.keys(STATUS_META) as OrderStatus[]).map(s => {
            const m = STATUS_META[s]
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-[#0d1a35] ${
                  s === current ? m.color : "text-[#a3aac4]"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                {m.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Add Order Modal ────────────────────────────────────────────────────────────

function AddOrderModal({ onClose, onAdd }: { onClose: () => void; onAdd: (o: Order) => void }) {
  const [code,    setCode]    = useState("")
  const [city,    setCity]    = useState("")
  const [agency,  setAgency]  = useState("")
  const [cName,   setCName]   = useState("")
  const [cPhone,  setCPhone]  = useState("")
  const [cAddr,   setCAddr]   = useState("")
  const [product, setProduct] = useState("")
  const [sku,     setSku]     = useState("")
  const [price,   setPrice]   = useState("")
  const [units,   setUnits]   = useState("1")
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res  = await fetch("/api/orders", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        code, city, agency,
        client_name: cName, client_phone: cPhone, client_address: cAddr,
        product, sku, unit_price: price, units,
      }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setSaving(false) }
    else            { onAdd(data); onClose() }
  }

  const total = (parseFloat(price) || 0) * (parseInt(units) || 0)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(6,14,32,0.88)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.95, y: 16  }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-xl rounded-2xl border border-[#1f2b49] my-auto"
        style={{ background: "#0a1628" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-[#1f2b49]">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Pedidos</p>
            <h2 className="text-lg font-semibold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>Nuevo Pedido</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] transition-colors">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6">

          {/* Cliente */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#FF6D00] uppercase mb-3 flex items-center gap-2">
              <User size={10} /> Información del Cliente
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Nombre completo" icon={<User size={10} />}>
                  <input value={cName} onChange={e => setCName(e.target.value)} placeholder="María Rodríguez" required className={inputCls} />
                </Field>
              </div>
              <Field label="Teléfono" icon={<Phone size={10} />}>
                <input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="809-555-0000" className={inputCls} />
              </Field>
              <Field label="Dirección" icon={<Home size={10} />}>
                <input value={cAddr} onChange={e => setCAddr(e.target.value)} placeholder="Av. Principal #10" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Producto */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#40C4FF] uppercase mb-3 flex items-center gap-2">
              <ShoppingBag size={10} /> Producto
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Nombre del producto" icon={<Package size={10} />}>
                  <input value={product} onChange={e => setProduct(e.target.value)} placeholder="iPhone 15 Pro" required className={inputCls} />
                </Field>
              </div>
              <Field label="SKU / Código" icon={<Hash size={10} />}>
                <input value={sku} onChange={e => setSku(e.target.value)} placeholder="IPH15P-BLK" className={`${inputCls} font-mono uppercase`} />
              </Field>
              <Field label="Precio unitario (USD)" icon={<DollarSign size={10} />}>
                <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" required className={inputCls} />
              </Field>
              <Field label="Cantidad" icon={<Package size={10} />}>
                <input type="number" min="1" value={units} onChange={e => setUnits(e.target.value)} placeholder="1" required className={inputCls} />
              </Field>
              <div className="flex flex-col gap-1.5 justify-end">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-[#a3aac4] uppercase">Total</p>
                <div className="px-3 py-2.5 rounded-lg bg-[#FF6D00]/10 border border-[#FF6D00]/20">
                  <p className="text-sm font-bold text-[#FF6D00]">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Envío */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#a3aac4] uppercase mb-3 flex items-center gap-2">
              <Truck size={10} /> Destino y Envío
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Código" icon={<Hash size={10} />}>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="SD" maxLength={4} className={`${inputCls} font-mono uppercase`} />
              </Field>
              <div className="col-span-2">
                <Field label="Ciudad" icon={<MapPin size={10} />}>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Santo Domingo" required className={inputCls} />
                </Field>
              </div>
              <div className="col-span-3">
                <Field label="Agencia de envío" icon={<Truck size={10} />}>
                  <input value={agency} onChange={e => setAgency(e.target.value)} placeholder="Caribe Express" className={inputCls} />
                </Field>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#FF6D00] hover:bg-[#e86200] text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50">
              {saving ? "Guardando..." : "Crear Pedido"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function OrdersDashboard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders,      setOrders]      = useState<Order[]>(initialOrders)
  const [showModal,   setShowModal]   = useState(false)
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all")

  const filtered = useMemo(() =>
    filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus),
    [orders, filterStatus]
  )

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + Number(o.total), 0), [orders])
  const activeCount  = useMemo(() => orders.filter(o => o.status === "active").length, [orders])
  const maxUnits     = useMemo(() => Math.max(1, ...orders.map(o => o.units)), [orders])
  const topAgency    = useMemo(() =>
    [...orders].sort((a, b) => Number(b.total) - Number(a.total))[0], [orders])

  function handleAdd(o: Order) {
    setOrders(prev => [o, ...prev])
  }

  async function handleStatusChange(order: Order, status: OrderStatus) {
    const res  = await fetch(`/api/orders/${order.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!data.error) setOrders(prev => prev.map(o => o.id === order.id ? data : o))
  }

  async function handleDelete(order: Order) {
    if (!confirm(`¿Eliminar el pedido de "${order.client_name}"? No se puede deshacer.`)) return
    const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" })
    if (res.ok) { setOrders(prev => prev.filter(o => o.id !== order.id)); setExpanded(null) }
  }

  return (
    <>
      <AnimatePresence>
        {showModal && <AddOrderModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
      </AnimatePresence>

      <div className="min-h-screen w-full" style={{ background: "linear-gradient(160deg, #060e20 0%, #091328 100%)" }}>
        <div className="px-6 py-8 space-y-7">

          {/* ── Header ── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#dee5ff]">Pedidos</h1>
              <p className="text-sm text-[#a3aac4] mt-0.5">
                {orders.length} pedido{orders.length !== 1 ? "s" : ""} · Gestiona y rastrea tus órdenes de venta
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6D00] hover:bg-[#e86200] text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-100 shrink-0"
            >
              <Plus size={15} /> Nuevo Pedido
            </button>
          </div>

          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative overflow-hidden rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#FF6D00]" />
              <Building2 size={64} className="absolute right-3 bottom-2 text-[#FF6D00]/6 pointer-events-none" />
              <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-3">Pedidos Activos</p>
              <p className="text-4xl font-light text-[#dee5ff] mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>{activeCount}</p>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-[#40C4FF]" />
                <span className="text-xs font-semibold text-[#40C4FF]">{orders.length} totales</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#40C4FF]" />
              <Truck size={64} className="absolute right-3 bottom-2 text-[#40C4FF]/6 pointer-events-none" />
              <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-3">Total en Ventas</p>
              <p className="text-4xl font-light text-[#dee5ff] mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                ${totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-[#FF6D00]" />
                <span className="text-xs font-semibold text-[#FF6D00]">{orders.reduce((s, o) => s + o.units, 0)} unidades</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0d1a35" }}>
              <Globe size={64} className="absolute right-3 bottom-2 text-[#dee5ff]/5 pointer-events-none" />
              <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-3">Agencia Líder</p>
              <p className="text-2xl font-semibold text-[#dee5ff] mb-1 truncate" style={{ fontFamily: "Manrope, sans-serif" }}>
                {topAgency?.agency || "—"}
              </p>
              <p className="text-xs text-[#a3aac4]">{topAgency?.city || "Sin pedidos aún"}</p>
              {topAgency && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF6D00]/10 border border-[#FF6D00]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6D00]" />
                  <span className="text-[10px] font-semibold text-[#FF6D00]">TOP AGENCIA</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Middle Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left column: Volume + Estado */}
            <div className="flex flex-col gap-4">
              {/* Volume */}
              <div className="rounded-xl border border-[#1f2b49] p-6 flex-1" style={{ background: "#0a1628" }}>
                <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-5">Volumen por Ciudad</p>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {[...orders].sort((a, b) => Number(b.total) - Number(a.total)).slice(0, 5).map((o, i) => (
                      <div key={o.id}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm text-[#dee5ff] truncate max-w-[120px]">{o.city}</span>
                          <span className="text-xs font-semibold text-[#a3aac4]">{o.units} u. · ${Number(o.total).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#1f2b49] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round((o.units / maxUnits) * 100)}%` }}
                            transition={{ duration: 0.8, delay: 0.1 + i * 0.08 }}
                            className="h-full rounded-full"
                            style={{ background: i % 2 === 0 ? "linear-gradient(90deg, #FF6D00, #ff9a4d)" : "linear-gradient(90deg, #40C4FF, #0099cc)" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Package size={28} className="text-[#1f2b49]" />
                    <p className="text-xs text-[#3a4460]">Sin pedidos aún</p>
                  </div>
                )}
              </div>

              {/* Estado */}
              <div className="rounded-xl border border-[#1f2b49] p-5" style={{ background: "#0a1628" }}>
                <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-4">Estado de Pedidos</p>
                <div className="space-y-3">
                  {(Object.keys(STATUS_META) as OrderStatus[]).map(key => {
                    const count = orders.filter(o => o.status === key).length
                    const pct   = orders.length ? Math.round((count / orders.length) * 100) : 0
                    const m     = STATUS_META[key]
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                            <span className="text-xs text-[#dee5ff]">{m.label}</span>
                          </div>
                          <span className="text-xs font-semibold text-[#a3aac4]">{count} · {pct}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#1f2b49] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7 }}
                            className={`h-full rounded-full ${m.dot}`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="lg:col-span-2 rounded-xl border border-[#1f2b49] overflow-hidden flex flex-col" style={{ background: "#0a1628" }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2b49]">
                <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase">Red de Distribución</p>
                {/* Filter por status */}
                <div className="flex items-center gap-1.5">
                  <Filter size={11} className="text-[#3a4460]" />
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as OrderStatus | "all")}
                    className="text-[11px] bg-transparent border-none text-[#a3aac4] focus:outline-none cursor-pointer hover:text-[#dee5ff] transition-colors"
                  >
                    <option value="all">Todos</option>
                    {(Object.keys(STATUS_META) as OrderStatus[]).map(s => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-auto flex-1">
                {filtered.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1f2b49]">
                        {["Ciudad", "Cliente", "Producto", "Total", "Estado"].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-[0.12em] text-[#a3aac4] uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filtered.map((o, i) => (
                          <>
                            <motion.tr
                              key={o.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ delay: i * 0.03 }}
                              className="border-b border-[#1f2b49]/50 hover:bg-[#0d1a35] transition-colors cursor-pointer"
                              onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  {o.code && <span className="text-[10px] font-bold text-[#FF6D00] bg-[#FF6D00]/10 px-1.5 py-0.5 rounded font-mono">{o.code}</span>}
                                  <span className="text-sm text-[#dee5ff] whitespace-nowrap">{o.city}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <p className="text-sm text-[#dee5ff]">{o.client_name}</p>
                                <p className="text-xs text-[#a3aac4]">{o.client_phone}</p>
                              </td>
                              <td className="px-5 py-3.5">
                                <p className="text-sm text-[#dee5ff] whitespace-nowrap">{o.product}</p>
                                <p className="text-xs text-[#a3aac4] font-mono">{o.sku || "—"} · ×{o.units}</p>
                              </td>
                              <td className="px-5 py-3.5 text-sm font-semibold text-[#dee5ff]">
                                ${Number(o.total).toLocaleString()}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <StatusDot status={o.status} />
                                  <span className={`text-xs font-semibold ${STATUS_META[o.status].color}`}>
                                    {STATUS_META[o.status].label}
                                  </span>
                                </div>
                              </td>
                            </motion.tr>

                            {/* Expanded detail row */}
                            <AnimatePresence>
                              {expanded === o.id && (
                                <motion.tr
                                  key={`${o.id}-exp`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                >
                                  <td colSpan={5} className="px-5 pb-4 pt-2" style={{ background: "#0d1a35" }}>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                      <div>
                                        <p className="text-[10px] text-[#a3aac4] uppercase tracking-widest mb-1">Dirección</p>
                                        <p className="text-xs text-[#dee5ff]">{o.client_address || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-[#a3aac4] uppercase tracking-widest mb-1">Agencia</p>
                                        <p className="text-xs text-[#dee5ff]">{o.agency || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-[#a3aac4] uppercase tracking-widest mb-1">Precio unitario</p>
                                        <p className="text-xs text-[#dee5ff]">${Number(o.unit_price).toLocaleString()} × {o.units} u.</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-[#a3aac4] uppercase tracking-widest mb-1">Registrado</p>
                                        <p className="text-xs text-[#dee5ff]">
                                          {new Date(o.created_at).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-3 border-t border-[#1f2b49]">
                                      <StatusSelector current={o.status} onChange={s => handleStatusChange(o, s)} />
                                      <button
                                        onClick={e => { e.stopPropagation(); handleDelete(o) }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs font-semibold text-red-400 hover:bg-red-500/15 transition-colors"
                                      >
                                        <Trash2 size={12} /> Eliminar
                                      </button>
                                    </div>
                                  </td>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                          </>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <ShoppingBag size={36} className="text-[#1f2b49]" />
                    <p className="text-sm text-[#a3aac4]">
                      {filterStatus !== "all" ? `No hay pedidos con estado "${STATUS_META[filterStatus as OrderStatus].label}"` : "Sin pedidos registrados"}
                    </p>
                    <button onClick={() => setShowModal(true)} className="text-xs text-[#FF6D00] hover:underline">
                      Crear primer pedido →
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#1f2b49]">
                <p className="text-xs text-[#a3aac4]">
                  {filtered.length} de {orders.length} pedidos · Clic en fila para ver detalle
                </p>
                <div className="flex items-center gap-2 text-xs text-[#40C4FF] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#40C4FF] animate-pulse" />
                  En tiempo real
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Row: Chart + Resumen ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
              <ShipmentChart orders={orders} />
            </div>

            <div className="rounded-xl p-6 flex flex-col justify-between" style={{ background: "linear-gradient(135deg, #FF6D00 0%, #cc5700 100%)" }}>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase mb-4">Resumen del Negocio</p>
                <CheckCircle2 size={36} className="text-white mb-4" strokeWidth={1.5} />
                <p className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: "Manrope, sans-serif" }}>ESTADO</p>
                <p className="text-2xl font-light text-white/90" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {orders.length > 0 ? "ACTIVO" : "EN ESPERA"}
                </p>
              </div>
              <div className="mt-6 space-y-2">
                {[
                  `${orders.length} pedido${orders.length !== 1 ? "s" : ""} registrado${orders.length !== 1 ? "s" : ""}`,
                  `$${totalRevenue.toLocaleString()} en ventas`,
                  `${orders.filter(o => o.status === "delivered").length} entregado${orders.filter(o => o.status === "delivered").length !== 1 ? "s" : ""}`,
                  "Base de datos conectada ✓",
                ].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
                    <span className="text-xs text-white/80">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
