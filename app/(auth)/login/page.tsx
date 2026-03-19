"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mail, Lock, ArrowRight } from "lucide-react"
import KainoLogo from "@/components/KainoLogo"

const inputCls = "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 bg-[#060e20] border border-[#1f2b49] text-[#dee5ff] placeholder-[#3a4460] focus:border-[#FF6D00]/50 focus:ring-[#FF6D00]/10"

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message.includes("Invalid login")
        ? "Email o contraseña incorrectos."
        : error.message)
      setLoading(false)
      return
    }
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#060e20" }}>
      <div className="w-full max-w-[400px] flex flex-col gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <KainoLogo size={48} className="rounded-2xl" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#dee5ff] tracking-tight">Bienvenido de vuelta</h1>
            <p className="text-sm text-[#a3aac4] mt-1">Ingresa a tu cuenta de SomosKaino</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#1f2b49] shadow-xl p-7 flex flex-col gap-5" style={{ background: "#0a1628" }}>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3aac4]" />
                <input type="email" placeholder="tu@empresa.com" value={email}
                  onChange={e => setEmail(e.target.value)} required className={inputCls} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3aac4]" />
                <input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required className={inputCls} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 bg-[#FF6D00] hover:bg-[#e86200] active:scale-[0.99] text-white font-semibold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Ingresando..." : (<>Ingresar <ArrowRight size={14} /></>)}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#a3aac4]">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-[#40C4FF] font-semibold hover:text-[#40C4FF]/80 transition-colors">
            Regístrate gratis
          </a>
        </p>
      </div>
    </div>
  )
}
