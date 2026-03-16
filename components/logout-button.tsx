"use client"

// Botón de cerrar sesión — necesita ser "use client" porque
// llama a Supabase desde el navegador y luego redirige

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LogoutButton() {
  const router  = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
      </svg>
      Cerrar sesión
    </button>
  )
}
