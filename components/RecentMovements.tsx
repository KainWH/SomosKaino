"use client"

import { useEffect, useState } from "react"
import { Database, ShoppingCart, RefreshCw, Package } from "lucide-react"

type Movement = {
  id:         string
  type:       "order_pending" | "order_completed" | "product_new" | "product_updated"
  title:      string
  sub:        string
  location:   string
  badge:      string
  created_at: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)  return "ahora"
  if (mins < 60) return `hace ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24)   return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

const TYPE_META = {
  order_pending:   { Icon: ShoppingCart, iconCls: "text-[#FF6D00]", bg: "bg-[#FF6D00]/10", badgeCls: "text-[#FF6D00] bg-[#FF6D00]/10 border-[#FF6D00]/20" },
  order_completed: { Icon: ShoppingCart, iconCls: "text-[#40C4FF]", bg: "bg-[#40C4FF]/10", badgeCls: "text-[#40C4FF] bg-[#40C4FF]/10 border-[#40C4FF]/20" },
  product_new:     { Icon: Package,      iconCls: "text-[#40C4FF]", bg: "bg-[#40C4FF]/10", badgeCls: "text-[#40C4FF] bg-[#40C4FF]/10 border-[#40C4FF]/20" },
  product_updated: { Icon: RefreshCw,    iconCls: "text-[#a3aac4]", bg: "bg-[#1f2b49]",    badgeCls: "text-[#a3aac4] bg-[#1f2b49]       border-[#1f2b49]"    },
}

export default function RecentMovements() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch("/api/inventory/movements")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setMovements(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="rounded-2xl border border-[#1f2b49] overflow-hidden h-full flex flex-col"
      style={{ background: "#0a1628" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2b49] shrink-0">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-[#a3aac4] uppercase">
          Movimientos Recientes
        </p>
        <a
          href="/inventory"
          className="text-[10px] text-[#40C4FF] hover:underline font-semibold transition-colors"
        >
          Ver todos →
        </a>
      </div>

      {/* List */}
      <div className="flex-1 divide-y divide-[#1f2b49] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 px-5 py-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-[#1f2b49] shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-2.5 bg-[#1f2b49] rounded w-3/4" />
                  <div className="h-2 bg-[#1f2b49] rounded w-1/2" />
                </div>
                <div className="h-6 w-12 bg-[#1f2b49] rounded-full" />
              </div>
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
            <Database size={28} className="text-[#1f2b49]" />
            <p className="text-xs text-[#3a4460]">Sin movimientos en los últimos 7 días</p>
          </div>
        ) : (
          movements.map(m => {
            const meta = TYPE_META[m.type]
            return (
              <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#0d1a35] transition-colors">
                <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 border border-[#1f2b49]`}>
                  <meta.Icon size={13} className={meta.iconCls} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#dee5ff] font-semibold truncate">{m.title}</p>
                  <p className="text-[10px] text-[#a3aac4] mt-0.5">
                    {m.sub ? `${m.sub} · ` : ""}{timeAgo(m.created_at)}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-[#a3aac4] bg-[#0d1a35] border border-[#1f2b49] px-2 py-0.5 rounded-full truncate max-w-[80px]">
                    {m.location}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${meta.badgeCls}`}>
                  {m.badge}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
