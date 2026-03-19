import Link from "next/link"
import { Settings, Package, Users, BarChart2, LucideIcon } from "lucide-react"

type Action = {
  label: string
  href:  string
  icon:  LucideIcon
  color: string
  bg:    string
}

const actions: Action[] = [
  { label: "Inventario",    href: "/inventory", icon: Package,   color: "text-[#40C4FF]",  bg: "bg-[#40C4FF]/10 border-[#40C4FF]/20 hover:bg-[#40C4FF]/15" },
  { label: "Reportes",     href: "/reports",   icon: BarChart2, color: "text-[#b36dff]",  bg: "bg-[#b36dff]/10 border-[#b36dff]/20 hover:bg-[#b36dff]/15" },
  { label: "Clientes",     href: "/contacts",  icon: Users,     color: "text-[#00e5cc]",  bg: "bg-[#00e5cc]/10 border-[#00e5cc]/20 hover:bg-[#00e5cc]/15" },
  { label: "Configuración", href: "/settings", icon: Settings,  color: "text-[#FF6D00]",  bg: "bg-[#FF6D00]/10 border-[#FF6D00]/20 hover:bg-[#FF6D00]/15" },
]

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-[#1f2b49] overflow-hidden" style={{ background: "#0a1628" }}>
      <div className="px-5 py-4 border-b border-[#1f2b49]">
        <h2 className="text-sm font-semibold text-[#dee5ff]">Acceso rápido</h2>
        <p className="text-[11px] text-[#a3aac4] mt-0.5">Módulos principales</p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${a.bg}`}
          >
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${a.bg} ${a.color}`}>
              <a.icon size={18} strokeWidth={1.75} />
            </div>
            <span className={`text-[11px] font-semibold ${a.color}`}>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
