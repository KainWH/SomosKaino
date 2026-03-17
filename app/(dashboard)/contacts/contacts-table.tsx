"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search, Plus, MessageCircle, Flame, Thermometer, Snowflake,
  Phone, X, User, SlidersHorizontal,
} from "lucide-react"
import type { Lead, LeadStatus } from "./page"

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadStatus }) {
  const map = {
    nuevo:       { label: "Nuevo",          cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    calificado:  { label: "Calificado",     cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    mostrando:   { label: "En Seguimiento", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  }
  const { label, cls } = map[status]
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
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
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
      <Thermometer size={13} className="shrink-0" /> Warm
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
      <Snowflake size={13} className="shrink-0" /> Cold
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-green-500" :
    score >= 40 ? "bg-amber-500" :
    "bg-slate-600"

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-400 w-7 text-right tabular-nums">{score}</span>
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
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <User size={15} className="text-green-400" />
            </div>
            <h2 className="text-sm font-semibold text-slate-200">Nuevo Contacto</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Nombre</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Carlos Martínez"
              className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/40 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/40 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Teléfono <span className="text-red-400">*</span></label>
            <div className="relative">
              <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="52155…"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/60 border border-slate-700/40 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/40 transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Notas</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} placeholder="Observaciones internas..."
              className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/40 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/40 transition-all resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700/40 bg-slate-800/40 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-xs font-semibold text-white transition-colors">
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
    all:       leads.length,
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

      <div className="flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Contactos y Leads</h1>
            <p className="text-base text-slate-500 mt-0.5">
              {leads.length} contacto{leads.length !== 1 ? "s" : ""} · Gestiona y califica tus leads de WhatsApp
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition-all shrink-0"
          >
            <Plus size={15} />
            Nuevo Contacto
          </button>
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/60 border border-slate-700/40 rounded-xl text-base text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/40 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1 bg-slate-800/60 border border-slate-800/60 rounded-xl p-1">
            {FILTER_LABELS.map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === val
                    ? "bg-slate-700 text-slate-100 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  filter === val ? "bg-slate-600 text-slate-300" : "bg-slate-800 text-slate-600"
                }`}>
                  {counts[val]}
                </span>
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
            <SlidersHorizontal size={13} />
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Table ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/60">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
              <User size={22} className="text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-slate-400">
                {search ? "Sin resultados para tu búsqueda" : "Sin contactos todavía"}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {search ? "Prueba con otro nombre o teléfono" : "Los contactos aparecerán cuando recibas mensajes de WhatsApp"}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/60 overflow-hidden">
            {/* Table header */}
            <div className="hidden lg:grid grid-cols-[2fr_1.2fr_140px_110px_140px_1.5fr_120px] gap-6 px-8 py-4 border-b border-slate-800/60 bg-slate-900/40">
              {["Contacto", "Teléfono", "Estado", "Temp.", "Score IA", "Último mensaje", ""].map((h) => (
                <span key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-500">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-800/40">
              {filtered.map((lead) => (
                <div
                  key={lead.id}
                  className="group hidden lg:grid grid-cols-[2fr_1.2fr_140px_110px_140px_1.5fr_120px] gap-6 px-8 py-4 items-center hover:bg-slate-800/30 transition-colors"
                >
                  {/* Contacto */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: lead.avatarColor }}
                    >
                      {lead.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-medium text-slate-200 truncate">{lead.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MessageCircle size={11} className="text-green-500 shrink-0" />
                        <span className="text-xs text-slate-500">WhatsApp</span>
                      </div>
                    </div>
                  </div>

                  {/* Teléfono */}
                  <span className="text-sm text-slate-500 font-mono">{lead.phone}</span>

                  {/* Estado */}
                  <StatusBadge status={lead.status} />

                  {/* Temperatura */}
                  <TempBadge temp={lead.temperature} />

                  {/* Score */}
                  <ScoreBar score={lead.score} />

                  {/* Último mensaje */}
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400 mb-0.5">{formatLastMsg(lead.lastMessageAt)}</p>
                    {lead.lastMessagePreview && (
                      <p className="text-xs text-slate-600 truncate max-w-[180px]">
                        {lead.lastMessagePreview.replace(/^[📍🖼️🎤]\s*/, "")}
                      </p>
                    )}
                  </div>

                  {/* Acción */}
                  {lead.conversationId ? (
                    <Link
                      href={`/inbox/${lead.conversationId}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/20 hover:text-green-300 transition-all opacity-0 group-hover:opacity-100 w-full"
                    >
                      <MessageCircle size={13} />
                      Ver chat
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
              ))}

              {/* Mobile rows */}
              {filtered.map((lead) => (
                <div key={`m-${lead.id}`} className="lg:hidden flex items-center gap-3 px-4 py-4 hover:bg-slate-800/30 transition-colors">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: lead.avatarColor }}
                  >
                    {lead.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-200 truncate">{lead.name}</p>
                      <StatusBadge status={lead.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 font-mono">{lead.phone}</span>
                      <TempBadge temp={lead.temperature} />
                    </div>
                  </div>
                  {lead.conversationId && (
                    <Link
                      href={`/inbox/${lead.conversationId}`}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all"
                    >
                      <MessageCircle size={14} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
