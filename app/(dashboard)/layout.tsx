// Layout del dashboard — Server Component (sin "use client")
// Al ser Server Component puede leer de Supabase directamente
// sin exponer datos sensibles al navegador

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LogoutButton from "@/components/logout-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Obtener el usuario actual
  // Si no hay sesión, el middleware ya redirige — esto es una segunda defensa
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Obtener el tenant del usuario para mostrar su nombre
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("owner_id", user.id)
    .single()  // .single() devuelve un objeto en vez de un array (sabemos que hay 1)

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-white border-r flex flex-col">

        {/* Logo */}
        <div className="p-4 border-b">
          <span className="text-lg font-bold text-green-600">RentIA</span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            📊 Dashboard
          </a>
          <a href="/inbox" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            💬 Inbox
          </a>
          <a href="/contacts" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            👥 Contactos
          </a>
          <a href="/knowledge" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            🧠 Conocimiento
          </a>
          <a href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            ⚙️ Configuración
          </a>
        </nav>

        {/* Info del usuario + logout */}
        <div className="p-4 border-t flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-700 truncate">
            {tenant?.name ?? "Mi cuenta"}
          </p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
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
