"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search, Plus, MessageCircle, Flame, Thermometer, Snowflake,
  Phone, X, User, SlidersHorizontal,
} from "lucide-react"
import type { Lead, LeadStatus } from "./page"

// ── Shared input style ────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3.5 py-2.5 bg-[#060e20] border border-[#1f2b49] rounded-xl text-sm text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:ring-1 focus:ring-[#FF6D00]/40 focus:border-[#FF6D00]/40 transition-all"

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadStatus }) {
  const map = {
    nuevo:       { label: "Nuevo",          cls: "bg-[#40C4FF]/10 text-[#40C4FF] border-[#40C4FF]/20" },
    calificado:  { label: "Calificado",     cls: "bg-[#FF6D00]/10 text-[#FF6D00] border-[#FF6D00]/20" },
    mostrando:   { label: "En Seguimiento", cls: "bg-[#b36dff]/10 text-[#b36dff] border-[#b36dff]/20" },
  }
  const { label, cls } = map[status]
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

function TempBadge({ temp }: { temp: Lead["temperature"] }) {
  if (temp === "hot")  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
      <Flame size={13} className="shrink-0" /> Hot
    </span>
  )
  if (temp === "warm") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6D00]">
      <Thermometer size={13} className="shrink-0" /> Warm
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3a4460]">
      <Snowflake size={13} className="shrink-0" /> Cold
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-[#FF6D00]" :
    score >= 40 ? "bg-[#40C4FF]" :
    "bg-[#1f2b49]"

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#0d1a35] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-semibold text-[#a3aac4] w-7 text-right tabular-nums">{score}</span>
    </div>
  )
}

function formatLastMsg(dateStr: string | null) {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = (now.getTime() - date.getTime()) / 36e5

  if (diff < 1)    return "Hace menos de 1h"
  if (diff < 24)   return `Hace ${Math.floor(diff)}h`
  if (diff < 48)   return "Ayer"
  if (diff < 168)  return `Hace ${Math.floor(diff / 24)} días`
  return date.toLocaleDateString("es-DO", { day: "numeric", month: "short" })
}

// ── New Contact Modal ─────────────────────────────────────────────────────────

function NewContactModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name,  setName]  = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) { setError("El teléfono es obligatorio"); return }
    setSaving(true)
    setError("")
    const res = await fetch("/api/contacts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: name.trim() || null, phone: phone.trim(), notes: notes.trim() || null }),
    })
    if (res.ok) { onCreated() }
    else        { const d = await res.json(); setError(d.error ?? "Error al crear contacto") }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#060e20]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[#1f2b49] shadow-2xl overflow-hidden" style={{ background: "#0a1628" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2b49]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF6D00]/10 border border-[#FF6D00]/20 flex items-center justify-center">
              <User size={15} className="text-[#FF6D00]" />
            </div>
            <h2 className="text-sm font-semibold text-[#dee5ff]">Nuevo Contacto</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#a3aac4] hover:text-[#dee5ff] hover:bg-[#1f2b49] transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#a3aac4]">Nombre</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Carlos Martínez"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#a3aac4]">
              Teléfono <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a4460]" />
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="52155…"
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#a3aac4]">Notas</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} placeholder="Observaciones internas..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1f2b49] bg-[#060e20] hover:bg-[#0d1a35] text-xs font-medium text-[#a3aac4] hover:text-[#dee5ff] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#FF6D00] hover:bg-[#e86200] disabled:opacity-50 text-xs font-semibold text-white transition-colors">
              {saving ? "Guardando..." : "Crear contacto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Table ────────────────────────────────────────────────────────────────

type Filter = "all" | "calificado" | "nuevo" | "mostrando"

const FILTER_LABELS: [Filter, string][] = [
  ["all",       "Todos"],
  ["calificado","Calificados"],
  ["nuevo",     "Nuevos"],
  ["mostrando", "En Seguimiento"],
]

export default function ContactsTable({ leads: initial, tenantId }: { leads: Lead[]; tenantId: string }) {
  const [leads,      setLeads]      = useState<Lead[]>(initial)
  const [search,     setSearch]     = useState("")
  const [filter,     setFilter]     = useState<Filter>("all")
  const [showModal,  setShowModal]  = useState(false)

  const counts = useMemo(() => ({
    all:        leads.length,
    calificado: leads.filter(l => l.status === "calificado").length,
    nuevo:      leads.filter(l => l.status === "nuevo").length,
    mostrando:  leads.filter(l => l.status === "mostrando").length,
  }), [leads])

  const filtered = useMemo(() => leads.filter((l) => {
    const matchSearch = !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
    const matchFilter = filter === "all" || l.status === filter
    return matchSearch && matchFilter
  }), [leads, search, filter])

  function handleCreated() {
    setShowModal(false)
    window.location.reload()
  }

  return (
    <>
      {showModal && (
        <NewContactModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      <div className="flex flex-col gap-5 p-4 sm:p-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Base de datos</p>
            <h1 className="text-xl font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>Contactos y Leads</h1>
            <p className="text-sm text-[#a3aac4] mt-0.5">
              {leads.length} contacto{leads.length !== 1 ? "s" : ""} · Gestiona y califica tus leads de WhatsApp
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6D00] hover:bg-[#e86200] text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition-all shrink-0 self-start"
          >
            <Plus size={15} />
            Nuevo Contacto
          </button>
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a4460]" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className={`${inputCls} pl-9`}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1 bg-[#060e20] border border-[#1f2b49] rounded-xl p-1 overflow-x-auto shrink-0">
            {FILTER_LABELS.map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filter === val
                    ? "bg-[#FF6D00]/15 text-[#FF6D00] border border-[#FF6D00]/25"
                    : "text-[#a3aac4] hover:text-[#dee5ff] border border-transparent"
                }`}
              >
                {label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  filter === val ? "bg-[#FF6D00]/20 text-[#FF6D00]" : "bg-[#1f2b49] text-[#3a4460]"
                }`}>
                  {counts[val]}
                </span>
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#3a4460] ml-auto">
            <SlidersHorizontal size={13} />
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Table ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 rounded-2xl border border-[#1f2b49]" style={{ background: "#0a1628" }}>
            <div className="w-14 h-14 rounded-2xl bg-[#0d1a35] border border-[#1f2b49] flex items-center justify-center">
              <User size={22} className="text-[#3a4460]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#a3aac4]">
                {search ? "Sin resultados para tu búsqueda" : "Sin contactos todavía"}
              </p>
              <p className="text-xs text-[#3a4460] mt-1">
                {search ? "Prueba con otro nombre o teléfono" : "Los contactos aparecerán cuando recibas mensajes de WhatsApp"}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1f2b49] overflow-hidden" style={{ background: "#0a1628" }}>
            {/* Desktop table header */}
            <div className="hidden lg:grid grid-cols-[2fr_1.2fr_140px_110px_140px_1.5fr_120px] gap-6 px-6 py-3.5 border-b border-[#1f2b49]" style={{ background: "#0d1a35" }}>
              {["Contacto", "Teléfono", "Estado", "Temp.", "Score IA", "Último mensaje", ""].map((h) => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-[#a3aac4]">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#1f2b49]">
              {filtered.map((lead) => (
                <>
                  {/* Desktop row */}
                  <div
                    key={lead.id}
                    className="group hidden lg:grid grid-cols-[2fr_1.2fr_140px_110px_140px_1.5fr_120px] gap-6 px-6 py-4 items-center hover:bg-[#0d1a35] transition-colors"
                  >
                    {/* Contacto */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: lead.avatarColor }}
                      >
                        {lead.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#dee5ff] truncate">{lead.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MessageCircle size={11} className="text-[#40C4FF] shrink-0" />
                          <span className="text-[10px] text-[#3a4460]">WhatsApp</span>
                        </div>
                      </div>
                    </div>

                    {/* Teléfono */}
                    <span className="text-sm text-[#a3aac4] font-mono">{lead.phone}</span>

                    {/* Estado */}
                    <StatusBadge status={lead.status} />

                    {/* Temperatura */}
                    <TempBadge temp={lead.temperature} />

                    {/* Score */}
                    <ScoreBar score={lead.score} />

                    {/* Último mensaje */}
                    <div className="min-w-0">
                      <p className="text-sm text-[#a3aac4] mb-0.5">{formatLastMsg(lead.lastMessageAt)}</p>
                      {lead.lastMessagePreview && (
                        <p className="text-xs text-[#3a4460] truncate max-w-[180px]">
                          {lead.lastMessagePreview.replace(/^[📍🖼️🎤]\s*/, "")}
                        </p>
                      )}
                    </div>

                    {/* Acción */}
                    {lead.conversationId ? (
                      <Link
                        href={`/inbox/${lead.conversationId}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#40C4FF]/10 border border-[#40C4FF]/20 text-[#40C4FF] text-xs font-semibold hover:bg-[#40C4FF]/20 transition-all opacity-0 group-hover:opacity-100 w-full"
                      >
                        <MessageCircle size={12} />
                        Ver chat
                      </Link>
                    ) : (
                      <span />
                    )}
                  </div>

                  {/* Mobile row */}
                  <div key={`m-${lead.id}`} className="lg:hidden flex items-center gap-3 px-4 py-3.5 hover:bg-[#0d1a35] transition-colors">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: lead.avatarColor }}
                    >
                      {lead.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-[#dee5ff] truncate">{lead.name}</p>
                        <StatusBadge status={lead.status} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#3a4460] font-mono">{lead.phone}</span>
                        <TempBadge temp={lead.temperature} />
                      </div>
                    </div>
                    {lead.conversationId && (
                      <Link
                        href={`/inbox/${lead.conversationId}`}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#40C4FF]/10 border border-[#40C4FF]/20 text-[#40C4FF] hover:bg-[#40C4FF]/20 transition-all shrink-0"
                      >
                        <MessageCircle size={14} />
                      </Link>
                    )}
                  </div>
                </>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
