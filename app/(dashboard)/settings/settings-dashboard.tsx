"use client"

import { useState, useEffect } from "react"
import {
  MessageSquare, Store, Shield, CreditCard,
  CheckCircle2, Eye, EyeOff, Phone, Globe,
  Lock, AlertCircle, ChevronRight, RefreshCw,
  ShieldCheck, Star, ExternalLink, Copy, Check,
} from "lucide-react"
import type { WhatsappConfig } from "@/types"

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = "whatsapp" | "negocio" | "seguridad" | "facturacion"

type Props = {
  whatsappConfig: WhatsappConfig | null
  tenantName:     string
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-[#060e20] border border-[#1f2b49] text-sm text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:border-[#FF6D00]/50 focus:ring-2 focus:ring-[#FF6D00]/10 transition-all"

const labelCls = "text-[11px] font-semibold uppercase tracking-widest text-[#a3aac4] block mb-1.5"

// ── Nav tabs ───────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "whatsapp",    label: "WhatsApp API",      icon: MessageSquare, desc: "Credenciales Meta" },
  { id: "negocio",     label: "Datos del Negocio", icon: Store,         desc: "Perfil de empresa" },
  { id: "seguridad",   label: "Seguridad",          icon: Shield,        desc: "Acceso y contraseña" },
  { id: "facturacion", label: "Facturación",         icon: CreditCard,    desc: "Plan y pagos" },
]

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#40C4FF]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#40C4FF]" /> Conectado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#FF6D00]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D00] animate-pulse" /> Pendiente
    </span>
  )
}

// ── WhatsApp Section ───────────────────────────────────────────────────────────

type VerifyResult = {
  ok:                     boolean
  phoneNumberId?:         string
  displayPhoneNumber?:    string
  verifiedName?:          string
  qualityRating?:         string
  codeVerificationStatus?: string
  error?:                 string
}

function qualityLabel(q?: string) {
  if (!q) return "—"
  if (q === "GREEN"  || q === "HIGH")   return "Alta"
  if (q === "YELLOW" || q === "MEDIUM") return "Media"
  if (q === "RED"    || q === "LOW")    return "Baja"
  return q
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={copy} className="ml-1.5 text-[#3a4460] hover:text-[#a3aac4] transition-colors shrink-0">
      {copied ? <Check size={12} className="text-[#40C4FF]" /> : <Copy size={12} />}
    </button>
  )
}

function WhatsAppSection({ config }: { config: WhatsappConfig | null }) {
  const [phoneId,     setPhoneId]     = useState(config?.phone_number_id ?? "")
  const [accessToken, setAccessToken] = useState("")
  const [showToken,   setShowToken]   = useState(false)
  const [saveStatus,  setSaveStatus]  = useState<"idle" | "saving" | "error">("idle")
  const [saveError,   setSaveError]   = useState("")
  const [testStatus,  setTestStatus]  = useState<"idle" | "testing" | "ok" | "error">("idle")
  const [testError,   setTestError]   = useState("")
  const [verified,    setVerified]    = useState<VerifyResult | null>(null)

  // Auto-test on mount if already configured
  useEffect(() => {
    if (config?.is_configured) testConnection()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function testConnection() {
    setTestStatus("testing"); setTestError(""); setVerified(null)
    const res  = await fetch("/api/settings/whatsapp/verify")
    const data: VerifyResult = await res.json()
    setVerified(data)
    setTestStatus(data.ok ? "ok" : "error")
    if (!data.ok) setTestError(data.error ?? "No se pudo verificar")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaveStatus("saving"); setSaveError("")
    const res  = await fetch("/api/settings/whatsapp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number_id: phoneId, access_token: accessToken }),
    })
    const data = await res.json()
    if (data.error) { setSaveError(data.error); setSaveStatus("error"); return }
    setSaveStatus("idle")
    testConnection()
  }

  const isConnected = testStatus === "ok"
  const isPending   = !config?.is_configured && testStatus === "idle"

  return (
    <div className="flex flex-col gap-6">

      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Meta Business</p>
          <h2 className="text-xl font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>
            Credenciales de WhatsApp
          </h2>
          <p className="text-sm text-[#a3aac4] mt-1">
            Gestiona tu conexión con{" "}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer"
              className="text-[#40C4FF] hover:underline">Meta for Developers</a>
          </p>
        </div>
        <StatusDot ok={isConnected} />
      </div>

      {/* ── Connected banner ── */}
      {isConnected && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-[#40C4FF]/25"
          style={{ background: "rgba(64,196,255,0.06)" }}>
          <div className="w-9 h-9 rounded-full bg-[#40C4FF]/15 border border-[#40C4FF]/25 flex items-center justify-center shrink-0">
            <CheckCircle2 size={17} className="text-[#40C4FF]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#dee5ff]">WhatsApp conectado</p>
            <p className="text-xs text-[#a3aac4]">Tu cuenta de WhatsApp Business está activa y lista para recibir mensajes.</p>
          </div>
        </div>
      )}

      {/* ── Estado de WhatsApp ── */}
      {isConnected && verified && (
        <div className="rounded-xl border border-[#1f2b49] overflow-hidden" style={{ background: "#0a1628" }}>
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1f2b49]" style={{ background: "#0d1a35" }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
                <Phone size={12} className="text-[#25D366]" />
              </div>
              <span className="text-sm font-semibold text-[#dee5ff]">Estado de WhatsApp</span>
            </div>
            <a
              href="https://business.facebook.com/wa/manage/phone-numbers/"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-[#40C4FF] hover:underline"
            >
              Abrir en Meta <ExternalLink size={11} />
            </a>
          </div>

          {/* 3-col stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#1f2b49] px-0">
            {/* Número */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-[#40C4FF]/10 border border-[#40C4FF]/15 flex items-center justify-center shrink-0">
                <Phone size={15} className="text-[#40C4FF]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#a3aac4] uppercase tracking-wider mb-0.5">Número</p>
                <p className="text-sm font-bold text-[#dee5ff]">{verified.displayPhoneNumber ?? "—"}</p>
              </div>
            </div>

            {/* Calidad */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-[#FF6D00]/10 border border-[#FF6D00]/15 flex items-center justify-center shrink-0">
                <Star size={15} className="text-[#FF6D00]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#a3aac4] uppercase tracking-wider mb-0.5">Calidad</p>
                <p className="text-sm font-bold text-[#dee5ff]">{qualityLabel(verified.qualityRating)}</p>
              </div>
            </div>

            {/* Verificación */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-[#b36dff]/10 border border-[#b36dff]/15 flex items-center justify-center shrink-0">
                <ShieldCheck size={15} className="text-[#b36dff]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#a3aac4] uppercase tracking-wider mb-0.5">Verificación</p>
                <p className="text-sm font-bold text-[#dee5ff]">
                  {verified.codeVerificationStatus === "VERIFIED" ? "Verificado"
                    : verified.codeVerificationStatus ?? (verified.verifiedName ? "Verificado" : "—")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Datos de la cuenta ── */}
      {config?.is_configured && (
        <div className="rounded-xl border border-[#1f2b49] overflow-hidden" style={{ background: "#0a1628" }}>
          <div className="px-5 py-3.5 border-b border-[#1f2b49]" style={{ background: "#0d1a35" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#a3aac4]">Datos de la cuenta</p>
          </div>
          <div className="divide-y divide-[#1f2b49]">
            {[
              { label: "Phone Number ID",    value: config.phone_number_id ?? "—", copy: true },
              { label: "Access Token",       value: "Configurado",                 copy: false },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-[#a3aac4]">{row.label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-mono text-[#dee5ff]">{row.value}</span>
                  {row.copy && row.value !== "—" && <CopyButton value={row.value} />}
                  <Check size={13} className="text-[#40C4FF] ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Test error ── */}
      {testStatus === "error" && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{testError}</p>
        </div>
      )}

      {/* ── Credentials form ── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#a3aac4]">
          {config?.is_configured ? "Actualizar credenciales" : "Configurar WhatsApp"}
        </p>

        {/* Phone Number ID */}
        <div>
          <label className={labelCls}>Phone Number ID</label>
          <p className="text-[11px] text-[#a3aac4] mb-2">Meta Developer → Tu App → WhatsApp → API Setup</p>
          <div className="relative">
            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a4460]" />
            <input
              type="text" value={phoneId} onChange={e => setPhoneId(e.target.value)}
              placeholder="123456789012345" required
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        {/* Access Token */}
        <div>
          <label className={labelCls}>Access Token</label>
          {config?.is_configured && (
            <p className="text-[11px] text-[#40C4FF] mb-2 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#40C4FF]" /> Token configurado — deja vacío para mantenerlo
            </p>
          )}
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a4460]" />
            <input
              type={showToken ? "text" : "password"}
              value={accessToken} onChange={e => setAccessToken(e.target.value)}
              placeholder={config?.is_configured
                ? (showToken ? "Token guardado — escribe para reemplazar" : "••••••••••••••••••••••")
                : "EAABsbCS..."}
              required={!config?.is_configured}
              className={`${inputCls} pl-9 pr-10 placeholder-[#a3aac4]`}
            />
            <button type="button" onClick={() => setShowToken(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3aac4] hover:text-[#dee5ff] transition-colors">
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Save error */}
        {saveStatus === "error" && (
          <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{saveError}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit" disabled={saveStatus === "saving"}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF6D00] hover:bg-[#e86200] text-white text-[11px] font-bold tracking-widest uppercase transition-all disabled:opacity-50 shadow-lg shadow-orange-900/20"
          >
            {saveStatus === "saving" ? "Guardando..." : "Actualizar Conexión"}
          </button>
          <button
            type="button"
            onClick={testConnection}
            disabled={testStatus === "testing" || !config?.is_configured}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#1f2b49] bg-[#0d1a35] hover:bg-[#1f2b49] text-[#dee5ff] text-[11px] font-bold tracking-widest uppercase transition-all disabled:opacity-40"
          >
            <RefreshCw size={12} className={testStatus === "testing" ? "animate-spin" : ""} />
            {testStatus === "testing" ? "Testeando..." : "Testear Conexión"}
          </button>
        </div>
      </form>

      {/* Help */}
      <div className="rounded-xl border border-[#1f2b49] px-4 py-3.5 text-xs text-[#a3aac4]" style={{ background: "#0d1a35" }}>
        <p className="font-semibold text-[#dee5ff] mb-1.5">¿Dónde encuentro mis credenciales?</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Ve a <span className="text-[#dee5ff]">developers.facebook.com</span> → Mis Apps</li>
          <li>Abre tu app → <span className="text-[#dee5ff]">WhatsApp → Configuración de API</span></li>
          <li>Copia el <span className="text-[#dee5ff]">Phone Number ID</span> y el <span className="text-[#dee5ff]">Token de acceso temporal</span></li>
        </ol>
      </div>
    </div>
  )
}

// ── Negocio Section ────────────────────────────────────────────────────────────

const SECTORS = [
  "Selecciona un sector",
  "Bienes Raíces",
  "Retail / Tienda Online",
  "Restaurante / Alimentos",
  "Salud y Bienestar",
  "Educación",
  "Servicios Profesionales",
  "Automotriz",
  "Turismo y Hospitalidad",
  "Tecnología",
  "Otro",
]

function NegocioSection({ tenantName }: { tenantName: string }) {
  const [nombre,  setNombre]  = useState(tenantName)
  const [sector,  setSector]  = useState("Selecciona un sector")
  const [website, setWebsite] = useState("")
  const [status,  setStatus]  = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading"); setErrorMsg("")
    const res  = await fetch("/api/settings/tenant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre }),
    })
    const data = await res.json()
    if (data.error) { setErrorMsg(data.error); setStatus("error") }
    else { setStatus("success"); setTimeout(() => setStatus("idle"), 3000) }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Section header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Empresa</p>
        <h2 className="text-xl font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>
          Datos del Negocio
        </h2>
        <p className="text-sm text-[#a3aac4] mt-1">Información pública de tu empresa en la plataforma</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Nombre */}
        <div>
          <label className={labelCls}>Nombre del Negocio</label>
          <input
            type="text" value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Mi Empresa S.A." required
            className={inputCls}
          />
        </div>

        {/* Sector */}
        <div>
          <label className={labelCls}>Sector</label>
          <div className="relative">
            <select
              value={sector} onChange={e => setSector(e.target.value)}
              className={`${inputCls} appearance-none pr-8 cursor-pointer`}
            >
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3aac4] pointer-events-none rotate-90" />
          </div>
        </div>

        {/* Sitio Web */}
        <div>
          <label className={labelCls}>Sitio Web</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a4460]" />
            <input
              type="url" value={website} onChange={e => setWebsite(e.target.value)}
              placeholder="https://minegocio.com"
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        {/* Feedback */}
        {status === "success" && (
          <div className="flex items-center gap-2 rounded-xl bg-[#40C4FF]/8 border border-[#40C4FF]/25 px-4 py-3"
            style={{ background: "rgba(64,196,255,0.06)" }}>
            <CheckCircle2 size={14} className="text-[#40C4FF]" />
            <p className="text-sm text-[#40C4FF]">Cambios guardados correctamente</p>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle size={14} className="text-red-400" />
            <p className="text-sm text-red-400">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit" disabled={status === "loading"}
          className="self-start inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#1f2b49] bg-[#0d1a35] hover:bg-[#1f2b49] text-[#dee5ff] text-[11px] font-bold tracking-widest uppercase transition-all disabled:opacity-50"
        >
          {status === "loading" ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  )
}

// ── Coming Soon Section ────────────────────────────────────────────────────────

function ComingSoonSection({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Próximamente</p>
        <h2 className="text-xl font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>{title}</h2>
        <p className="text-sm text-[#a3aac4] mt-1">{desc}</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-[#1f2b49]" style={{ background: "#0d1a35" }}>
        <div className="w-16 h-16 rounded-2xl bg-[#1f2b49] border border-[#2a3a5c] flex items-center justify-center mb-4">
          <Icon size={24} className="text-[#3a4460]" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-[#a3aac4]">Disponible próximamente</p>
        <p className="text-xs text-[#3a4460] mt-1">Esta sección está en desarrollo</p>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function SettingsDashboard({ whatsappConfig, tenantName }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("whatsapp")

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">
          SomosKaino / Configuración
        </p>
        <h1 className="text-2xl font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>
          Configuración
        </h1>
        <p className="text-sm text-[#a3aac4] mt-0.5">Conecta tu cuenta y personaliza tu perfil</p>
      </div>

      {/* Split view */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left nav ── */}
        <nav className="w-full lg:w-64 shrink-0 rounded-2xl border border-[#1f2b49] overflow-hidden" style={{ background: "#0a1628" }}>
          <div className="px-4 py-3.5 border-b border-[#1f2b49]">
            <p className="text-[10px] font-semibold tracking-widest text-[#3a4460] uppercase">Secciones</p>
          </div>
          <div className="p-2">
            {TABS.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                    active
                      ? "bg-[#FF6D00]/10 border-l-2 border-l-[#FF6D00] pl-[10px]"
                      : "border-l-2 border-l-transparent hover:bg-[#0d1a35]"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    active ? "bg-[#FF6D00]/15" : "bg-[#0d1a35]"
                  }`}>
                    <tab.icon size={15} className={active ? "text-[#FF6D00]" : "text-[#3a4460]"} strokeWidth={active ? 2.25 : 1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${active ? "text-[#FF6D00]" : "text-[#a3aac4]"}`}>
                      {tab.label}
                    </p>
                    <p className="text-[10px] text-[#3a4460] truncate">{tab.desc}</p>
                  </div>
                  {active && <ChevronRight size={13} className="text-[#FF6D00] shrink-0" />}
                </button>
              )
            })}
          </div>
        </nav>

        {/* ── Right content ── */}
        <div className="flex-1 min-w-0 rounded-2xl border border-[#1f2b49] p-6 sm:p-8" style={{ background: "#0a1628" }}>
          {activeTab === "whatsapp" && <WhatsAppSection config={whatsappConfig} />}
          {activeTab === "negocio"  && <NegocioSection  tenantName={tenantName} />}
          {activeTab === "seguridad"   && (
            <ComingSoonSection icon={Shield}     title="Seguridad" desc="Gestión de contraseña y autenticación de dos factores" />
          )}
          {activeTab === "facturacion" && (
            <ComingSoonSection icon={CreditCard} title="Facturación" desc="Gestión de tu plan, pagos y facturas" />
          )}
        </div>
      </div>
    </div>
  )
}
