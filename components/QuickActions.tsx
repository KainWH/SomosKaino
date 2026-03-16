import Link from "next/link"
import { Settings, Package, Users, BarChart2, LucideIcon } from "lucide-react"

type Action = {
  label: string
  href:  string
  icon:  LucideIcon
  color: string
  bg:    string
  glow:  string
}

const actions: Action[] = [
  { label: "Configuración", href: "/settings", icon: Settings, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/15", glow: "group-hover:shadow-orange-500/10" },
  { label: "Inventario", href: "/inventory", icon: Package,  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/15",       glow: "group-hover:shadow-blue-500/10" },
  { label: "Clientes",   href: "/contacts",  icon: Users,    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/15", glow: "group-hover:shadow-emerald-500/10" },
  { label: "Reportes",   href: "/reports",   icon: BarChart2, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/15", glow: "group-hover:shadow-purple-500/10" },
]

export default function QuickActions() {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800/60">
        <h2 className="text-sm font-semibold text-slate-200">Acceso rápido</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">Módulos principales</p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200
              hover:scale-[1.02] hover:shadow-lg ${a.glow} ${a.bg}`}
          >
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${a.bg} ${a.color}`}>
              <a.icon size={18} strokeWidth={1.75} />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
