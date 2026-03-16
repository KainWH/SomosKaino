import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LogoutButton from "@/components/logout-button"
import SidebarNav from "@/components/sidebar-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("owner_id", user.id)
    .single()

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── SIDEBAR ── */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">

        {/* Logo */}
        <div className="px-5 h-14 flex items-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <span className="text-[15px] font-bold text-gray-900 tracking-tight">RentIA</span>
          </div>
        </div>

        {/* Navegación */}
        <SidebarNav />

        {/* Info del usuario + logout */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-green-700">
                {(tenant?.name ?? user.email ?? "U")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {tenant?.name ?? "Mi cuenta"}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>

      </aside>

      {/* ── CONTENIDO ── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>

    </div>
  )
}
