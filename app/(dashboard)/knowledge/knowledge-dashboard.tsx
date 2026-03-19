"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import {
  Package, FileText, ShoppingBag, Globe,
  RefreshCw, Trash2, Pencil, Plus, Upload,
  X, ChevronDown, Save, CheckCircle2,
} from "lucide-react"
import type { KnowledgeDocument } from "@/types"

// ── Types ──────────────────────────────────────────────────────────────────────

type CatalogConfig = {
  sheet_url?: string | null
  sheet_id?:  string | null
  sheet_gid?: string | null
  enabled?:   boolean | null
}

type AiConfig = {
  system_prompt?: string | null
  enabled?:       boolean | null
  model?:         string | null
}

type Props = {
  aiConfig:      AiConfig | null
  catalogConfig: CatalogConfig | null
  documents:     KnowledgeDocument[]
  kainoActive:   number
  sheetsActive:  boolean
  docsActive:    number
  catalogId:     string | null
  isConfigured:  boolean
}

type CardStatus = "synced" | "training" | "failed" | "inactive"

// ── Shared input style ─────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-[#060e20] border border-[#1f2b49] text-sm text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:border-[#FF6D00]/50 focus:ring-2 focus:ring-[#FF6D00]/10 transition-all"

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-[#FF6D00]" : "bg-[#1f2b49]"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CardStatus }) {
  const map = {
    synced:   { label: "Sincronizado",   cls: "text-[#40C4FF] bg-[#40C4FF]/10 border-[#40C4FF]/25" },
    training: { label: "Entrenando",     cls: "text-[#FF6D00] bg-[#FF6D00]/10 border-[#FF6D00]/25" },
    failed:   { label: "Error",          cls: "text-red-400 bg-red-500/10 border-red-500/25" },
    inactive: { label: "Sin configurar", cls: "text-[#3a4460] bg-[#0d1a35] border-[#1f2b49]" },
  }
  const { label, cls } = map[status]
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

// ── Knowledge Card Shell ───────────────────────────────────────────────────────

function KnowledgeCard({
  icon, title, subtitle, status, meta,
  expanded, onToggle, children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  status: CardStatus
  meta?: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        expanded ? "border-[#FF6D00]/30 shadow-lg shadow-orange-900/10" : "border-[#1f2b49] hover:border-[#2a3a5c]"
      }`}
      style={{ background: "#0a1628" }}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 sm:p-5 text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#0d1a35] border border-[#1f2b49]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#dee5ff]">{title}</p>
          <p className="text-xs text-[#a3aac4] mt-0.5">{subtitle}</p>
          {meta && <p className="text-[10px] text-[#3a4460] mt-0.5">{meta}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={status} />
          <ChevronDown
            size={14}
            className={`text-[#a3aac4] transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#1f2b49]">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

// ── Training Gauge ─────────────────────────────────────────────────────────────

function TrainingGauge({ readiness, tokenCount }: { readiness: number; tokenCount: number }) {
  const R            = 68
  const circumference = 2 * Math.PI * R
  const offset       = circumference * (1 - readiness / 100)
  const bars         = [0.35, 0.65, 0.45, 0.9, 0.55, 0.8, 0.4, 0.72, 0.5, 0.88, 0.6, 0.75]

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Estado del modelo</p>
        <p className="text-base font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>Training Pulse</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {/* Circular gauge */}
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
            <circle cx="80" cy="80" r={R} fill="none" stroke="#1f2b49" strokeWidth="10" />
            <circle
              cx="80" cy="80" r={R}
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.2s ease" }}
            />
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF6D00" />
                <stop offset="100%" stopColor="#40C4FF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>
              {readiness}%
            </span>
            <span className="text-[9px] text-[#a3aac4] uppercase tracking-widest">Listo</span>
          </div>
        </div>

        <p className="text-xs text-[#a3aac4] text-center leading-relaxed">
          {tokenCount > 0
            ? `Procesando ~${tokenCount.toLocaleString()} tokens activos`
            : "Activa fuentes de conocimiento para entrenar al agente"}
        </p>
      </div>

      {/* Kinetic activity bars */}
      <div className="flex items-end gap-1 h-9">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h * 100}%`,
              background: i % 3 === 0
                ? "linear-gradient(180deg, #FF6D00 0%, #cc5700 100%)"
                : i % 3 === 1
                ? "linear-gradient(180deg, #40C4FF 0%, #0099cc 100%)"
                : "linear-gradient(180deg, #2a3a5c 0%, #1f2b49 100%)",
              opacity: readiness > 0 ? 0.85 : 0.25,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Source Picker Modal ────────────────────────────────────────────────────────

type SourceOption = {
  id:       string
  icon:     React.ReactNode
  bg:       string
  accent:   string
  title:    string
  desc:     string
  openForm?: boolean
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id:    "catalog",
    icon:  <Package     size={22} className="text-[#FF6D00]" />,
    bg:    "bg-[#FF6D00]/10 border-[#FF6D00]/20",
    accent:"text-[#FF6D00]",
    title: "Catálogo de Productos",
    desc:  "Productos con foto, precio y descripción creados en SomosKaino",
  },
  {
    id:    "sheets",
    icon:  <Globe       size={22} className="text-[#40C4FF]" />,
    bg:    "bg-[#40C4FF]/10 border-[#40C4FF]/20",
    accent:"text-[#40C4FF]",
    title: "Google Sheets",
    desc:  "Conecta un spreadsheet con inventario, precios e imágenes",
  },
  {
    id:       "docs",
    icon:     <FileText  size={22} className="text-[#b36dff]" />,
    bg:       "bg-[#b36dff]/10 border-[#b36dff]/20",
    accent:   "text-[#b36dff]",
    title:    "Documento",
    desc:     "FAQ, precios, políticas — escribe texto o sube un archivo .txt/.md",
    openForm: true,
  },
  {
    id:    "whatsapp",
    icon:  <ShoppingBag size={22} className="text-[#40C4FF]" />,
    bg:    "bg-[#40C4FF]/10 border-[#40C4FF]/20",
    accent:"text-[#40C4FF]",
    title: "WhatsApp Business",
    desc:  "Publica tu catálogo en Meta Commerce y sincroniza productos",
  },
]

function SourcePickerModal({
  onClose,
  onPick,
}: {
  onClose: () => void
  onPick:  (cardId: string, openForm?: boolean) => void
}) {
  // Close on backdrop click
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,14,32,0.80)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#1f2b49] overflow-hidden shadow-2xl"
        style={{ background: "#0a1628" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1f2b49]">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Knowledge Base</p>
            <h2 className="text-lg font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>
              Añadir fuente
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Options grid */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOURCE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onPick(opt.id, opt.openForm)}
              className="flex flex-col gap-3 p-4 rounded-xl border border-[#1f2b49] text-left hover:border-[#2a3a5c] hover:scale-[1.02] active:scale-[0.99] transition-all"
              style={{ background: "#0d1a35" }}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${opt.bg}`}>
                {opt.icon}
              </div>
              <div>
                <p className={`text-sm font-semibold ${opt.accent}`}>{opt.title}</p>
                <p className="text-xs text-[#a3aac4] mt-0.5 leading-relaxed">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-5 pb-5">
          <p className="text-center text-[10px] text-[#3a4460]">
            Puedes añadir múltiples fuentes. El agente usará todas a la vez.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Catalog Card ───────────────────────────────────────────────────────────────

function CatalogCard({ kainoActive, expanded, onToggle }: {
  kainoActive: number; expanded: boolean; onToggle: () => void
}) {
  return (
    <KnowledgeCard
      icon={<Package size={18} className="text-[#FF6D00]" />}
      title="Catálogo de Productos"
      subtitle="Productos con foto, precio y descripción"
      status={kainoActive > 0 ? "synced" : "inactive"}
      meta={kainoActive > 0 ? `${kainoActive} producto${kainoActive > 1 ? "s" : ""} activos` : undefined}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[#a3aac4]">
          {kainoActive > 0
            ? <>El agente conoce <span className="text-[#FF6D00] font-semibold">{kainoActive} producto{kainoActive > 1 ? "s" : ""}</span> y puede enviar sus fotos automáticamente por WhatsApp.</>
            : "Aún no tienes productos. Crea tu catálogo y el agente podrá responder preguntas y enviar fotos."}
        </p>
        <a
          href="/catalog"
          className="self-start inline-flex items-center gap-2 bg-[#FF6D00] hover:bg-[#e86200] text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 active:scale-100"
        >
          {kainoActive > 0 ? "Gestionar catálogo" : "Crear primer producto"} →
        </a>
      </div>
    </KnowledgeCard>
  )
}

// ── Sheets Card ────────────────────────────────────────────────────────────────

function SheetsCard({ config, sheetsActive, expanded, onToggle, resetTrigger }: {
  config: CatalogConfig | null; sheetsActive: boolean; expanded: boolean; onToggle: () => void; resetTrigger?: number
}) {
  const [savedUrl,  setSavedUrl]  = useState(config?.sheet_url ?? "")
  const [showForm,  setShowForm]  = useState(false)
  const [isEditing, setIsEditing] = useState(false)   // true = editing saved, false = adding new
  const [formUrl,   setFormUrl]   = useState("")
  const [status,    setStatus]    = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg,  setErrorMsg]  = useState("")
  const [summary,   setSummary]   = useState<{ productos: number; conFoto: number; sinFoto: number } | null>(null)

  // "Add Source → Sheets" opens a blank form for a new URL
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      setFormUrl(""); setIsEditing(false); setStatus("idle"); setErrorMsg(""); setSummary(null); setShowForm(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger])

  function openEdit() {
    setFormUrl(savedUrl); setIsEditing(true); setStatus("idle"); setErrorMsg(""); setSummary(null); setShowForm(true)
  }
  function openNew() {
    setFormUrl(""); setIsEditing(false); setStatus("idle"); setErrorMsg(""); setSummary(null); setShowForm(true)
  }
  function cancelForm() {
    setShowForm(false); setStatus("idle"); setSummary(null); setErrorMsg("")
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar este Google Sheet?")) return
    await fetch("/api/settings/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheet_url: "" }) })
    setSavedUrl("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading"); setErrorMsg("")
    const res  = await fetch("/api/settings/catalog", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet_url: formUrl }),
    })
    const data = await res.json()
    if (data.error) { setErrorMsg(data.error); setStatus("error") }
    else { setSavedUrl(formUrl); setSummary(data.summary); setStatus("success"); setShowForm(false) }
  }

  const cardStatus: CardStatus = savedUrl ? "synced" : "inactive"

  return (
    <KnowledgeCard
      icon={<Globe size={18} className="text-[#40C4FF]" />}
      title="Google Sheets"
      subtitle="Inventario con productos, precios e imágenes"
      status={cardStatus}
      meta={config?.sheet_id ? `ID: ${config.sheet_id}` : undefined}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-3">

        {/* Saved connection */}
        {savedUrl && !showForm && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[#1f2b49]" style={{ background: "#0d1a35" }}>
            <Globe size={14} className="text-[#40C4FF] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#dee5ff] truncate">{savedUrl}</p>
              <p className="text-[10px] text-[#3a4460] mt-0.5">Sheet conectado</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={openEdit} className="p-1.5 text-[#a3aac4] hover:text-[#dee5ff] rounded-lg hover:bg-[#1f2b49] transition-colors">
                <Pencil size={12} />
              </button>
              <button onClick={handleDisconnect} className="p-1.5 text-[#a3aac4] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Inline form */}
        {showForm ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 rounded-lg border border-[#40C4FF]/20 bg-[#40C4FF]/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#dee5ff]">{isEditing ? "Editar sheet" : "Conectar nuevo sheet"}</p>
              <button type="button" onClick={cancelForm} className="p-1 text-[#a3aac4] hover:text-[#dee5ff] rounded transition-colors">
                <X size={14} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-[#dee5ff] block mb-1">URL del Google Sheet</label>
              <p className="text-[11px] text-[#a3aac4] mb-1.5">Compartido como "Cualquiera con el enlace puede ver"</p>
              <input
                type="url" value={formUrl} onChange={e => setFormUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..." required
                className={inputCls}
              />
            </div>
            {errorMsg && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{errorMsg}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={status === "loading"}
                className="bg-[#40C4FF]/10 hover:bg-[#40C4FF]/20 text-[#40C4FF] border border-[#40C4FF]/25 text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-all">
                {status === "loading" ? "Verificando..." : isEditing ? "Actualizar" : "Conectar"}
              </button>
              <button type="button" onClick={cancelForm}
                className="text-sm px-4 py-2 rounded-lg border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={openNew}
            className="flex items-center justify-center gap-1.5 text-xs text-[#40C4FF] font-medium border border-[#40C4FF]/20 border-dashed rounded-lg px-3 py-2.5 hover:bg-[#40C4FF]/5 transition-colors"
          >
            <Plus size={11} /> {savedUrl ? "Conectar otro sheet" : "Conectar sheet"}
          </button>
        )}

        {status === "success" && summary && (
          <div className="bg-[#40C4FF]/10 border border-[#40C4FF]/25 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-[#40C4FF] mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} /> Sheet conectado y verificado
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Productos", val: summary.productos },
                { label: "Con foto",  val: summary.conFoto },
                { label: "Sin foto",  val: summary.sinFoto },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-xl font-bold text-[#dee5ff]">{val}</p>
                  <p className="text-xs text-[#a3aac4]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#0d1a35] border border-[#1f2b49] rounded-lg px-3 py-2.5 text-xs text-[#a3aac4] space-y-1">
          <p className="font-medium text-[#dee5ff]">Formato requerido:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Columna con nombre del producto (ej: "Modelo", "Nombre")</li>
            <li>Columna con URL de imagen en Drive (ej: "Imagen Url")</li>
          </ul>
        </div>
      </div>
    </KnowledgeCard>
  )
}

// ── Documents Card ─────────────────────────────────────────────────────────────

function DocumentsCard({ initialDocs, expanded, onToggle, triggerNewDoc }: {
  initialDocs: KnowledgeDocument[]; expanded: boolean; onToggle: () => void; triggerNewDoc?: number
}) {
  const [docs, setDocs]         = useState<KnowledgeDocument[]>(initialDocs)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<KnowledgeDocument | null>(null)
  const [name, setName]         = useState("")
  const [content, setContent]   = useState("")
  const [saving, setSaving]     = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [loadingFile, setLoadingFile] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const activeCount  = docs.filter(d => d.enabled).length
  const cardStatus: CardStatus = activeCount > 0 ? "synced" : "inactive"

  // Auto-open the new-doc form when parent increments triggerNewDoc
  useEffect(() => {
    if (triggerNewDoc && triggerNewDoc > 0) openCreate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNewDoc])

  function openCreate() {
    setEditing(null); setName(""); setContent(""); setErrorMsg(""); setShowForm(true)
  }
  function openEdit(doc: KnowledgeDocument) {
    setEditing(doc); setName(doc.name); setContent(doc.content); setErrorMsg(""); setShowForm(true)
  }
  function cancelForm() {
    setShowForm(false); setEditing(null); setName(""); setContent("")
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) { setErrorMsg("El archivo no debe superar 1MB"); return }
    setLoadingFile(true); setErrorMsg("")
    try {
      const text = await file.text()
      if (!text.trim()) { setErrorMsg("El archivo está vacío"); setLoadingFile(false); return }
      const docName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      setName(prev => prev || docName); setContent(text); setShowForm(true)
    } catch { setErrorMsg("No se pudo leer el archivo") }
    setLoadingFile(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErrorMsg("")
    const url    = editing ? `/api/knowledge/documents/${editing.id}` : "/api/knowledge/documents"
    const method = editing ? "PATCH" : "POST"
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, content }) })
    const data   = await res.json()
    if (data.error) { setErrorMsg(data.error) }
    else { setDocs(prev => editing ? prev.map(d => d.id === editing.id ? data : d) : [...prev, data]); cancelForm() }
    setSaving(false)
  }

  async function toggleEnabled(doc: KnowledgeDocument) {
    const res  = await fetch(`/api/knowledge/documents/${doc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !doc.enabled }) })
    const data = await res.json()
    if (!data.error) setDocs(prev => prev.map(d => d.id === doc.id ? data : d))
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento?")) return
    const res = await fetch(`/api/knowledge/documents/${id}`, { method: "DELETE" })
    if (res.ok) setDocs(prev => prev.filter(d => d.id !== id))
  }

  return (
    <KnowledgeCard
      icon={<FileText size={18} className="text-[#b36dff]" />}
      title="Documentos"
      subtitle="FAQ, precios, políticas — texto o archivos"
      status={cardStatus}
      meta={activeCount > 0 ? `${activeCount} doc${activeCount > 1 ? "s" : ""} activo${activeCount > 1 ? "s" : ""}` : undefined}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-3">
        {/* Document list */}
        {docs.length > 0 && !showForm && (
          <div className="flex flex-col gap-2">
            {docs.map(doc => (
              <div
                key={doc.id}
                className={`flex items-center gap-3 p-3 rounded-lg border border-[#1f2b49] transition-opacity ${!doc.enabled ? "opacity-50" : ""}`}
                style={{ background: "#0d1a35" }}
              >
                <button
                  onClick={() => toggleEnabled(doc)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${doc.enabled ? "bg-[#b36dff]" : "bg-[#1f2b49]"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${doc.enabled ? "translate-x-4" : "translate-x-1"}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#dee5ff] truncate">{doc.name}</p>
                  <p className="text-[10px] text-[#3a4460]">{doc.content.length.toLocaleString()} caracteres</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(doc)} className="p-1.5 text-[#a3aac4] hover:text-[#dee5ff] rounded-lg hover:bg-[#1f2b49] transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-[#a3aac4] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inline form */}
        {showForm ? (
          <form onSubmit={handleSave} className="flex flex-col gap-3 p-4 rounded-lg border border-[#b36dff]/20 bg-[#b36dff]/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#dee5ff]">{editing ? "Editar documento" : "Nuevo documento"}</p>
              <button type="button" onClick={cancelForm} className="p-1 text-[#a3aac4] hover:text-[#dee5ff] rounded transition-colors">
                <X size={14} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-[#a3aac4] block mb-1.5">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ej: Lista de precios, FAQ..." required className={inputCls} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#a3aac4]">Contenido</label>
                <span className="text-[10px] text-[#3a4460]">{content.length.toLocaleString()} chars</span>
              </div>
              <textarea
                rows={6} value={content} onChange={e => setContent(e.target.value)}
                placeholder="Escribe o pega el texto que el agente debe conocer..." required
                className={`${inputCls} resize-none font-mono text-xs`}
              />
            </div>
            {errorMsg && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{errorMsg}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-[#b36dff]/15 hover:bg-[#b36dff]/25 text-[#b36dff] border border-[#b36dff]/25 text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-all">
                {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar"}
              </button>
              <button type="button" onClick={cancelForm} className="text-sm px-4 py-2 rounded-lg border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={openCreate}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-[#b36dff] font-medium border border-[#b36dff]/20 border-dashed rounded-lg px-3 py-2.5 hover:bg-[#b36dff]/5 transition-colors"
            >
              <Pencil size={11} /> Escribir
            </button>
            <button
              onClick={() => fileRef.current?.click()} disabled={loadingFile}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-[#a3aac4] font-medium border border-dashed border-[#1f2b49] rounded-lg px-3 py-2.5 hover:bg-[#0d1a35] transition-colors disabled:opacity-50"
            >
              <Upload size={11} /> {loadingFile ? "Leyendo..." : "Subir"}
            </button>
            <input ref={fileRef} type="file" accept=".txt,.md,.csv,.json" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {docs.length === 0 && !showForm && (
          <p className="text-center text-[10px] text-[#3a4460]">Soporta .txt, .md, .csv, .json · Máx 1MB</p>
        )}
      </div>
    </KnowledgeCard>
  )
}

// ── WhatsApp Business Card ─────────────────────────────────────────────────────

function WhatsAppCard({ catalogId, isConfigured, kainoCount, expanded, onToggle }: {
  catalogId: string | null; isConfigured: boolean; kainoCount: number; expanded: boolean; onToggle: () => void
}) {
  const [savedId,   setSavedId]   = useState(catalogId ?? "")
  const [showForm,  setShowForm]  = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formId,    setFormId]    = useState("")
  const [status,    setStatus]    = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg,  setErrorMsg]  = useState("")
  const [message,   setMessage]   = useState("")

  function openEdit() {
    setFormId(savedId); setIsEditing(true); setStatus("idle"); setErrorMsg(""); setShowForm(true)
  }
  function openNew() {
    setFormId(""); setIsEditing(false); setStatus("idle"); setErrorMsg(""); setShowForm(true)
  }
  function cancelForm() {
    setShowForm(false); setStatus("idle"); setErrorMsg("")
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault(); setStatus("loading"); setErrorMsg("")
    const res  = await fetch("/api/knowledge/whatsapp-catalog/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ catalog_id: formId }) })
    const data = await res.json()
    if (data.error) { setErrorMsg(data.error); setStatus("error") }
    else { setMessage(data.message ?? ""); setSavedId(formId); setStatus("success"); setShowForm(false) }
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar el catálogo de WhatsApp Business?")) return
    await fetch("/api/knowledge/whatsapp-catalog/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ catalog_id: "" }) })
    setSavedId(""); setStatus("idle")
  }

  const connected = !!savedId

  return (
    <KnowledgeCard
      icon={<ShoppingBag size={18} className="text-[#40C4FF]" />}
      title="WhatsApp Business"
      subtitle="Publica tu catálogo en Meta Commerce"
      status={connected ? "synced" : "inactive"}
      meta={connected ? "Auto-publicación activa" : undefined}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-3">
        {!isConfigured && (
          <div className="bg-[#FF6D00]/10 border border-[#FF6D00]/25 rounded-lg px-3 py-2.5 text-xs text-[#FF6D00]">
            Primero guarda tu <strong>Access Token</strong> en{" "}
            <a href="/settings" className="underline font-medium">Configuración</a>.
          </div>
        )}
        {!connected && kainoCount > 0 && (
          <div className="bg-[#40C4FF]/10 border border-[#40C4FF]/25 rounded-lg px-3 py-2.5 text-xs text-[#40C4FF]">
            Tienes <strong>{kainoCount} producto{kainoCount > 1 ? "s" : ""}</strong> en SomosKaino listos para publicar.
          </div>
        )}

        {/* Saved catalog ID */}
        {connected && !showForm && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[#1f2b49]" style={{ background: "#0d1a35" }}>
            <ShoppingBag size={14} className="text-[#40C4FF] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#dee5ff] font-mono truncate">{savedId}</p>
              <p className="text-[10px] text-[#3a4460] mt-0.5">Catálogo conectado · auto-publicación activa</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={openEdit} className="p-1.5 text-[#a3aac4] hover:text-[#dee5ff] rounded-lg hover:bg-[#1f2b49] transition-colors">
                <Pencil size={12} />
              </button>
              <button onClick={handleDisconnect} className="p-1.5 text-[#a3aac4] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Inline form */}
        {showForm ? (
          <form onSubmit={handleConnect} className="flex flex-col gap-3 p-4 rounded-lg border border-[#40C4FF]/20 bg-[#40C4FF]/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#dee5ff]">{isEditing ? "Editar catálogo" : "Conectar catálogo"}</p>
              <button type="button" onClick={cancelForm} className="p-1 text-[#a3aac4] hover:text-[#dee5ff] rounded transition-colors">
                <X size={14} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-[#dee5ff] block mb-1">ID del Catálogo de Meta</label>
              <p className="text-[11px] text-[#a3aac4] mb-1.5">Meta Business Manager → Commerce → Catálogos → Configuración</p>
              <input
                type="text" value={formId} onChange={e => setFormId(e.target.value)}
                placeholder="ej: 1234567890123456" disabled={!isConfigured} required
                className={inputCls}
              />
            </div>
            {errorMsg && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{errorMsg}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={!isConfigured || status === "loading" || !formId.trim()}
                className="bg-[#40C4FF]/10 hover:bg-[#40C4FF]/20 text-[#40C4FF] border border-[#40C4FF]/25 text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-all">
                {status === "loading" ? "Conectando..." : isEditing ? "Actualizar" : kainoCount > 0 ? `Conectar y subir ${kainoCount}` : "Conectar"}
              </button>
              <button type="button" onClick={cancelForm}
                className="text-sm px-4 py-2 rounded-lg border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={openNew}
            disabled={!isConfigured}
            className="flex items-center justify-center gap-1.5 text-xs text-[#40C4FF] font-medium border border-[#40C4FF]/20 border-dashed rounded-lg px-3 py-2.5 hover:bg-[#40C4FF]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={11} /> {connected ? "Cambiar catálogo" : "Conectar catálogo"}
          </button>
        )}

        {status === "success" && (
          <p className="text-sm text-[#40C4FF] bg-[#40C4FF]/10 border border-[#40C4FF]/25 px-3 py-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 size={14} /> {message || "Listo"}
          </p>
        )}
        {status === "error" && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{errorMsg}</p>
        )}

        <details className="text-xs">
          <summary className="text-[#a3aac4] cursor-pointer hover:text-[#dee5ff] transition-colors">¿Cómo obtener el ID del Catálogo?</summary>
          <ol className="mt-2 bg-[#0d1a35] border border-[#1f2b49] rounded-lg px-3 py-2.5 text-[#a3aac4] space-y-0.5 list-decimal list-inside">
            <li>Ve a <span className="font-medium text-[#dee5ff]">business.facebook.com</span></li>
            <li>Abre <span className="font-medium text-[#dee5ff]">Commerce → Catálogos</span></li>
            <li>Selecciona tu catálogo → <span className="font-medium text-[#dee5ff]">Configuración</span></li>
            <li>Copia el <span className="font-medium text-[#dee5ff]">ID del catálogo</span></li>
          </ol>
        </details>
      </div>
    </KnowledgeCard>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

const PERSONALITIES = [
  "Professional & Helpful",
  "Friendly & Conversational",
  "Sales-Focused",
  "Technical Expert",
  "Concise & Direct",
]

export default function KnowledgeDashboard({
  aiConfig, catalogConfig, documents,
  kainoActive, sheetsActive, docsActive,
  catalogId, isConfigured,
}: Props) {
  // AI config state
  const [agentName,     setAgentName]     = useState("Kaino Assistant")
  const [personality,   setPersonality]   = useState("Professional & Helpful")
  const [systemPrompt,  setSystemPrompt]  = useState(aiConfig?.system_prompt ?? "")
  const [aiEnabled,     setAiEnabled]     = useState(aiConfig?.enabled ?? true)
  const [testChat,      setTestChat]      = useState(false)
  const [aiSaving,      setAiSaving]      = useState(false)
  const [aiSaved,       setAiSaved]       = useState(false)

  // Accordion
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Source picker modal
  const [showSourcePicker, setShowSourcePicker] = useState(false)

  // Trigger to open docs create form from outside (incremented to fire)
  const [docFormTrigger,    setDocFormTrigger]    = useState(0)
  // Trigger to reset sheets form (so "Add Source → Sheets" starts blank)
  const [sheetsResetTrigger, setSheetsResetTrigger] = useState(0)

  // Last sync time
  const [lastSync] = useState(() => new Date())

  // Readiness = 25% per active source (AI prompt + catalog + sheets + docs)
  const readiness = useMemo(() => {
    let score = 0
    if (systemPrompt.trim()) score += 25
    if (kainoActive > 0)     score += 25
    if (sheetsActive)        score += 25
    if (docsActive > 0)      score += 25
    return score
  }, [systemPrompt, kainoActive, sheetsActive, docsActive])

  const tokenCount = useMemo(() => {
    let t = 0
    if (systemPrompt.trim()) t += Math.ceil(systemPrompt.length / 4)
    if (kainoActive > 0)     t += kainoActive * 150
    if (sheetsActive)        t += 500
    if (docsActive > 0)      t += docsActive * 300
    return t
  }, [systemPrompt, kainoActive, sheetsActive, docsActive])

  async function saveAiConfig() {
    setAiSaving(true)
    await fetch("/api/settings/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_prompt: systemPrompt, enabled: aiEnabled }),
    })
    setAiSaving(false)
    setAiSaved(true)
    setTimeout(() => setAiSaved(false), 3000)
  }

  function toggleCard(id: string) {
    setExpandedCard(prev => prev === id ? null : id)
  }

  function handleSourcePick(cardId: string, openForm?: boolean) {
    setShowSourcePicker(false)
    setExpandedCard(cardId)
    if (cardId === "docs" && openForm) {
      setDocFormTrigger(prev => prev + 1)
    }
    if (cardId === "sheets") {
      setSheetsResetTrigger(prev => prev + 1)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {showSourcePicker && (
        <SourcePickerModal
          onClose={() => setShowSourcePicker(false)}
          onPick={handleSourcePick}
        />
      )}

      <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">

        {/* ── AI Agent Configuration ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: Neural Identity (3/5) */}
          <div className="lg:col-span-3 rounded-xl border border-[#1f2b49] p-6 flex flex-col gap-5" style={{ background: "#0a1628" }}>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Configuración del Agente</p>
              <h2 className="text-lg font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>
                AI Agent Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest block mb-1.5">
                  Agent Name
                </label>
                <input
                  type="text" value={agentName} onChange={e => setAgentName(e.target.value)}
                  placeholder="Kaino Assistant"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest block mb-1.5">
                  Personality Type
                </label>
                <div className="relative">
                  <select
                    value={personality} onChange={e => setPersonality(e.target.value)}
                    className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                  >
                    {PERSONALITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3aac4] pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#a3aac4] uppercase tracking-widest">
                  Instruction Set (Neural Prompt)
                </label>
                <span className="text-[10px] text-[#3a4460]">{systemPrompt.length} chars</span>
              </div>
              <textarea
                rows={6}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder={`Eres ${agentName}, un asistente de ventas para WhatsApp. Responde siempre en español con tono ${personality.toLowerCase()}. Usa el catálogo de productos para responder preguntas sobre precios, disponibilidad y especificaciones...`}
                className={`${inputCls} resize-none font-mono text-xs`}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1f2b49]">
              <div className="flex items-center gap-3">
                <Toggle checked={aiEnabled} onChange={setAiEnabled} />
                <span className="text-sm text-[#dee5ff]">Respuestas automáticas</span>
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={testChat} onChange={setTestChat} />
                <span className="text-sm text-[#a3aac4]">Test Chat</span>
              </div>
            </div>
          </div>

          {/* Right: Training Pulse (2/5) */}
          <div className="lg:col-span-2 rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
            <TrainingGauge readiness={readiness} tokenCount={tokenCount} />
          </div>
        </div>

        {/* ── Knowledge Base Manager ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Fuentes de datos</p>
              <h2 className="text-lg font-bold text-[#dee5ff]" style={{ fontFamily: "Manrope, sans-serif" }}>
                Knowledge Base
              </h2>
            </div>
            <button
              onClick={() => setShowSourcePicker(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6D00] hover:bg-[#e86200] text-white text-sm font-semibold transition-all hover:scale-105 active:scale-100 shadow-lg shadow-orange-900/20"
            >
              <Plus size={14} /> Add Source
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <CatalogCard
              kainoActive={kainoActive}
              expanded={expandedCard === "catalog"}
              onToggle={() => toggleCard("catalog")}
            />
            <SheetsCard
              config={catalogConfig}
              sheetsActive={sheetsActive}
              expanded={expandedCard === "sheets"}
              onToggle={() => toggleCard("sheets")}
              resetTrigger={sheetsResetTrigger}
            />
            <DocumentsCard
              initialDocs={documents}
              expanded={expandedCard === "docs"}
              onToggle={() => toggleCard("docs")}
              triggerNewDoc={docFormTrigger}
            />
            <WhatsAppCard
              catalogId={catalogId}
              isConfigured={isConfigured}
              kainoCount={kainoActive}
              expanded={expandedCard === "whatsapp"}
              onToggle={() => toggleCard("whatsapp")}
            />
          </div>
        </div>

        <div className="h-2" />
      </div>

      {/* ── Global Action Bar ── */}
      <div
        className="sticky bottom-0 border-t border-[#1f2b49] px-4 sm:px-8 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: "rgba(6,14,32,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-2 text-xs text-[#a3aac4]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#40C4FF] animate-pulse shrink-0" />
          Last Sync: {lastSync.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#40C4FF]/40 text-[#40C4FF] text-[11px] font-bold tracking-widest uppercase hover:bg-[#40C4FF]/10 transition-all"
          >
            <RefreshCw size={11} /> Sync Now
          </button>
          <button
            onClick={saveAiConfig}
            disabled={aiSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6D00] hover:bg-[#e86200] text-white text-[11px] font-bold tracking-widest uppercase transition-all disabled:opacity-50 shadow-lg shadow-orange-900/20"
          >
            <Save size={11} />
            {aiSaving ? "Guardando..." : aiSaved ? "¡Guardado!" : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  )
}
