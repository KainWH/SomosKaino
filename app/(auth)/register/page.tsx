"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { User, Building2, Mail, Lock, ArrowRight } from "lucide-react"
import KainoLogo from "@/components/KainoLogo"

const inputCls =
  "w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 bg-[#060e20] border border-[#1f2b49] text-[#dee5ff] placeholder-[#3a4460] focus:border-[#FF6D00]/50 focus:ring-[#FF6D00]/10"

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [name,            setName]            = useState("")
  const [company,         setCompany]         = useState("")
  const [email,           setEmail]           = useState("")
  const [password,        setPassword]        = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState("")
  const [success,         setSuccess]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, company },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (error) {
      setError(error.message.includes("already registered")
        ? "Este email ya está registrado. ¿Quieres iniciar sesión?"
        : error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#060e20" }}>
      <div className="w-full max-w-[420px] flex flex-col gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <KainoLogo size={48} className="rounded-2xl" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#dee5ff] tracking-tight">Crea tu cuenta</h1>
            <p className="text-sm text-[#a3aac4] mt-1">Empieza sin tarjeta de crédito</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#1f2b49] shadow-xl p-7 flex flex-col gap-5" style={{ background: "#0a1628" }}>

          {success && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#40C4FF]/10 border border-[#40C4FF]/20 flex items-center justify-center">
                <Mail size={22} className="text-[#40C4FF]" />
              </div>
              <p className="text-[#dee5ff] font-semibold">Revisa tu correo</p>
              <p className="text-sm text-[#a3aac4]">
                Te enviamos un link de confirmación a <span className="text-[#dee5ff]">{email}</span>.<br />
                Al confirmarlo serás redirigido al login.
              </p>
              <a href="/login" className="mt-2 text-sm text-[#40C4FF] hover:text-[#40C4FF]/80 font-semibold transition-colors">
                Ir al login →
              </a>
            </div>
          )}

          {!success && error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Nombre + Empresa */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest">Nombre</label>
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3aac4]" />
                    <input type="text" placeholder="Tu nombre" value={name}
                      onChange={e => setName(e.target.value)} required className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest">Empresa</label>
                  <div className="relative">
                    <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3aac4]" />
                    <input type="text" placeholder="Tu negocio" value={company}
                      onChange={e => setCompany(e.target.value)} required className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest">Correo electrónico</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3aac4]" />
                  <input type="email" placeholder="tu@empresa.com" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 bg-[#060e20] border border-[#1f2b49] text-[#dee5ff] placeholder-[#3a4460] focus:border-[#FF6D00]/50 focus:ring-[#FF6D00]/10" />
                </div>
              </div>

              {/* Contraseña + Confirmar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest">Contraseña</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3aac4]" />
                    <input type="password" placeholder="Mín. 6 caracteres" value={password}
                      onChange={e => setPassword(e.target.value)} required className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest">Confirmar</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3aac4]" />
                    <input type="password" placeholder="Repite la clave" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} required className={inputCls} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full flex items-center justify-center gap-2 bg-[#FF6D00] hover:bg-[#e86200] active:scale-[0.99] text-white font-semibold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creando cuenta..." : (<>Crear cuenta <ArrowRight size={14} /></>)}
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm text-[#a3aac4]">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-[#40C4FF] font-semibold hover:text-[#40C4FF]/80 transition-colors">
              Inicia sesión
            </a>
          </p>
          <p className="text-xs text-[#3a4460]">
            Al registrarte aceptas nuestros{" "}
            <a href="#" className="underline hover:text-[#a3aac4]">Términos</a>{" "}y{" "}
            <a href="#" className="underline hover:text-[#a3aac4]">Privacidad</a>
          </p>
        </div>

      </div>
    </div>
  )
}
