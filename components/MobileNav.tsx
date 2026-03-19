"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Menu, X,
  LayoutDashboard, MessageCircle, Users, ShoppingCart,
  Package, Tag, BarChart2, Brain, Settings, LogOut, LucideIcon,
} from "lucide-react"
import KainoLogo from "@/components/KainoLogo"

type NavItem  = { href: string; label: string; icon: LucideIcon; badge?: string }
type Section  = { title: string; items: NavItem[] }

const sections: Section[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
      { href: "/inbox",     label: "WhatsApp",   icon: MessageCircle, badge: "•" },
      { href: "/contacts",  label: "Clientes",   icon: Users },
    ],
  },
  {
    title: "Negocio",
    items: [
      { href: "/orders",    label: "Pedidos",    icon: ShoppingCart },
      { href: "/inventory", label: "Inventario", icon: Package },
      { href: "/reports",   label: "Reportes",   icon: BarChart2 },
    ],
  },
  {
    title: "Configuración",
    items: [
      { href: "/knowledge", label: "IA & Conocimiento", icon: Brain },
      { href: "/settings",  label: "Configuración",     icon: Settings },
    ],
  },
]

export default function MobileNav({ tenantName, email }: { tenantName?: string; email?: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()
  const initials = (tenantName ?? "?").slice(0, 2).toUpperCase()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  // En conversaciones el ConversationHeader tiene su propio back button
  const inConversation = pathname.startsWith("/inbox/")

  return (
    <>
      {/* Botón hamburguesa — fijo en la esquina superior izquierda, solo mobile */}
      {!inConversation && (
        <button
          onClick={() => setOpen(true)}
          className="md:hidden fixed top-0 left-0 z-50 h-14 w-14 flex items-center justify-center text-[#a3aac4] hover:text-[#dee5ff] transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-[#060e20]/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 border-r border-[#1f2b49] flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#0a1628" }}
      >
        {/* Header del drawer */}
        <div className="px-4 h-14 flex items-center justify-between border-b border-[#1f2b49] shrink-0">
          <div className="flex items-center gap-2.5">
            <KainoLogo size={32} className="rounded-xl shrink-0" />
            <span className="text-[15px] font-bold text-[#dee5ff] tracking-tight">SomosKaino</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-5">
          {sections.map((sec) => (
            <div key={sec.title}>
              <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3a4460]">
                {sec.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {sec.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-[#FF6D00]/10 text-[#FF6D00] border border-[#FF6D00]/25"
                          : "text-[#a3aac4] hover:bg-[#0d1a35] hover:text-[#dee5ff] border border-transparent"
                      }`}
                    >
                      <item.icon
                        size={16}
                        strokeWidth={active ? 2.25 : 1.75}
                        className={active ? "text-[#FF6D00]" : "text-[#3a4460]"}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#40C4FF]" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Usuario */}
        <div className="px-3 py-3 border-t border-[#1f2b49] shrink-0">
          {tenantName && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #FF6D00 0%, #e86200 100%)" }}
              >
                <span className="text-[10px] font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#dee5ff] truncate">{tenantName}</p>
                {email && <p className="text-[10px] text-[#3a4460] truncate">{email}</p>}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#a3aac4] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={12} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
