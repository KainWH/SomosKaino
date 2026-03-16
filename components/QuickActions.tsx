import Link from "next/link"
import { ShoppingCart, Package, Users, BarChart2, LucideIcon } from "lucide-react"

type Action = {
  label:  string
  href:   string
  icon:   LucideIcon
  color:  string
  bg:     string
  badge?: number
}

export default function QuickActions({ pendingOrders = 0 }: { pendingOrders?: number }) {
  const actions: Action[] = [
    { label: "Pedidos",    href: "/orders",    icon: ShoppingCart, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50", badge: pendingOrders },
    { label: "Inventario", href: "/inventory", icon: Package,      color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50" },
    { label: "Clientes",   href: "/contacts",  icon: Users,        color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50" },
    { label: "Reportes",   href: "/reports",   icon: BarChart2,    color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50" },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Acceso rápido</h2>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-150 hover:scale-[1.02]"
          >
            <div className="relative">
              <div className={`w-11 h-11 rounded-xl ${a.bg} ${a.color} flex items-center justify-center transition-colors`}>
                <a.icon size={20} strokeWidth={1.75} />
              </div>
              {!!a.badge && a.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {a.badge > 99 ? "99+" : a.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
