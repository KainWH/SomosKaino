"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  Search, Plus, Pencil, Trash2, Package, Wallet,
  Zap, AlertTriangle, RefreshCw,
  ArrowUpRight, X, Upload, ChevronDown, SlidersHorizontal,
} from "lucide-react"
import type { CatalogProduct } from "@/types"

// ── Constants ──────────────────────────────────────────────────────────────────

const CURRENCIES = ["USD", "DOP", "MXN", "COP", "ARS", "EUR"]

const CATEGORIES = [
  { id: "ropa",         label: "Ropa & Accesorios",    color: "#b36dff" },
  { id: "electronica",  label: "Electrónica",           color: "#40C4FF" },
  { id: "hogar",        label: "Hogar & Decoración",   color: "#00e5cc" },
  { id: "alimentos",    label: "Alimentos & Bebidas",   color: "#FF6D00" },
  { id: "salud",        label: "Salud & Belleza",       color: "#ff4d8d" },
  { id: "tecnologia",   label: "Tecnología",            color: "#40C4FF" },
  { id: "deportes",     label: "Deportes",              color: "#FF6D00" },
  { id: "servicios",    label: "Servicios",             color: "#a3aac4" },
  { id: "otros",        label: "Otros",                 color: "#3a4460"  },
]

type Category = { id: string; label: string; color: string }

function categoryMeta(id: string | null, cats: Category[] = CATEGORIES) {
  return cats.find(c => c.id === id) ?? null
}

type StockFilter = "all" | "active" | "inactive"

// ── Helpers ────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-[#060e20] border border-[#1f2b49] text-sm text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:border-[#FF6D00]/50 focus:ring-2 focus:ring-[#FF6D00]/10 transition-all"
const labelCls =
  "text-[10px] font-semibold tracking-[0.12em] text-[#a3aac4] uppercase"

function statusFor(p: CatalogProduct) {
  return p.enabled
    ? { label: "En Stock",  dot: "bg-[#40C4FF]",  text: "text-[#40C4FF]",  border: "border-[#40C4FF]/30 bg-[#40C4FF]/10", pulse: true }
    : { label: "Agotado",   dot: "bg-[#FF6D00]",  text: "text-[#FF6D00]",  border: "border-[#FF6D00]/30 bg-[#FF6D00]/10", pulse: false }
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={enabled ? "Activo — clic para pausar" : "Pausado — clic para activar"}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-100 ${
        enabled
          ? "border-[#40C4FF]/30 bg-[#40C4FF]/10 text-[#40C4FF]"
          : "border-[#FF6D00]/30 bg-[#FF6D00]/10 text-[#FF6D00]"
      }`}
    >
      <span className={`relative inline-flex w-9 h-5 rounded-full transition-colors shrink-0 ${enabled ? "bg-[#40C4FF]" : "bg-[#1f2b49]"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
      {enabled ? "Activo" : "Inactivo"}
    </button>
  )
}

// ── Product Card ───────────────────────────────────────────────────────────────

function ProductCard({
  product, waConnected, allCategories, onEdit, onDelete, onToggle,
}: {
  product:       CatalogProduct
  waConnected:   boolean
  allCategories: Category[]
  onEdit:   (p: CatalogProduct) => void
  onDelete: (p: CatalogProduct) => void
  onToggle: (p: CatalogProduct) => void
}) {
  const status = statusFor(product)
  const sku    = `#SKU-${product.id.slice(0, 4).toUpperCase()}`

  return (
    <div
      className="rounded-xl border border-[#1f2b49] overflow-hidden flex flex-col transition-all duration-300 hover:border-[#FF6D00]/40 hover:shadow-lg hover:shadow-orange-500/5 group"
      style={{ background: "#0a1628" }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden shrink-0" style={{ background: "#0d1a35" }}>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-[#1f2b49]" />
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${status.border} backdrop-blur-sm`}
          style={{ background: "rgba(6,14,32,0.80)" }}>
          <span className={`h-2 w-2 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
          <span className={`text-[10px] font-bold ${status.text}`}>{status.label}</span>
        </div>

        {waConnected && product.enabled && (
          <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#40C4FF]/15 border border-[#40C4FF]/25 flex items-center justify-center text-sm">
            💬
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#dee5ff] leading-snug">{product.name}</p>
          {product.description && (
            <p className="text-xs text-[#a3aac4] mt-1 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] font-mono text-[#3a4460] bg-[#0d1a35] px-2 py-0.5 rounded-md border border-[#1f2b49]">{sku}</span>
            {product.category && (() => {
              const cat = categoryMeta(product.category, allCategories)
              return cat ? (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ color: cat.color, background: `${cat.color}18`, borderColor: `${cat.color}35` }}
                >
                  {cat.label}
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#1f2b49] text-[#3a4460] bg-[#0d1a35]">
                  {product.category}
                </span>
              )
            })()}
          </div>
        </div>

        {product.price != null && (
          <p className="text-lg font-bold text-[#FF6D00]">
            {product.currency}&nbsp;{Number(product.price).toLocaleString("es", { minimumFractionDigits: 2 })}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1f2b49]">
          <Toggle enabled={product.enabled} onToggle={() => onToggle(product)} />
          <div className="flex gap-1.5 ml-auto">
            <button
              onClick={() => onEdit(product)}
              className="p-2 rounded-xl border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] hover:border-[#FF6D00]/40 transition-all duration-200"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(product)}
              className="p-2 rounded-xl border border-[#1f2b49] text-[#a3aac4] hover:text-red-400 hover:border-red-500/30 transition-all duration-200"
              title="Eliminar"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Product Side Panel ─────────────────────────────────────────────────────────

function ProductPanel({
  product, allCategories, onSave, onClose,
}: {
  product:       CatalogProduct | null
  allCategories: Category[]
  onSave:  (p: CatalogProduct) => void
  onClose: () => void
}) {
  const [name,      setName]      = useState(product?.name        ?? "")
  const [desc,      setDesc]      = useState(product?.description ?? "")
  const [price,     setPrice]     = useState(product?.price?.toString() ?? "")
  const [currency,  setCurrency]  = useState(product?.currency    ?? "USD")
  const [category,  setCategory]  = useState(product?.category    ?? "")
  const [imageUrl,  setImageUrl]  = useState(product?.image_url   ?? "")
  const [preview,   setPreview]   = useState(product?.image_url   ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    setPreview(URL.createObjectURL(file))
    const fd = new FormData()
    fd.append("file", file)
    const res  = await fetch("/api/catalog/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (data.error) { setError(data.error); setPreview(imageUrl) }
    else            { setImageUrl(data.url); setPreview(data.url) }
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (uploading) return
    setSaving(true)
    setError("")
    const isEdit = !!product
    const res  = await fetch(
      isEdit ? `/api/catalog/products/${product.id}` : "/api/catalog/products",
      {
        method:  isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, description: desc, price, currency, image_url: imageUrl, category: category || null }),
      }
    )
    const data = await res.json()
    if (data.error) { setError(data.error); setSaving(false) }
    else            { onSave(data) }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(6,14,32,0.65)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-md flex flex-col border-l border-[#1f2b49] overflow-hidden"
        style={{ background: "#0a1628" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1f2b49] shrink-0">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a3aac4] uppercase mb-0.5">Inventario</p>
            <h2 className="text-base font-bold text-[#dee5ff]">
              {product ? "Editar Producto" : "Nuevo Producto"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] hover:border-[#2a3a5c] transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} id="product-form" className="flex flex-col gap-6">

            {/* Image */}
            <div className="flex flex-col gap-2">
              <p className={labelCls}>Imagen del producto</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-full h-44 rounded-xl border-2 border-dashed border-[#1f2b49] hover:border-[#FF6D00]/50 transition-colors overflow-hidden flex flex-col items-center justify-center gap-2"
                style={{ background: "#0d1a35" }}
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload size={22} className="text-[#3a4460]" />
                    <span className="text-xs text-[#3a4460]">Clic para subir imagen</span>
                  </>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(6,14,32,0.7)" }}>
                    <span className="text-xs text-[#dee5ff]">Subiendo...</span>
                  </div>
                )}
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={() => { setImageUrl(""); setPreview("") }}
                  className="text-xs text-red-400 hover:text-red-300 text-left transition-colors"
                >
                  Quitar imagen
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            {/* Name */}
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Nombre del producto *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ej. iPhone 15 Pro, Laptop Dell XPS..."
                required
                className={inputCls}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Descripción</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Características, disponibilidad, condiciones..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Categoría</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className={`${inputCls} appearance-none pr-8`}
                >
                  <option value="">Sin categoría</option>
                  {allCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3aac4] pointer-events-none" />
              </div>
              {category && (() => {
                const cat = categoryMeta(category, allCategories)
                return cat ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit"
                    style={{ color: cat.color, background: `${cat.color}12`, borderColor: `${cat.color}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="text-xs font-semibold">{cat.label}</span>
                  </div>
                ) : null
              })()}
            </div>

            {/* Price + Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Precio</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Moneda</label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className={`${inputCls} appearance-none pr-8`}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3aac4] pointer-events-none" />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1f2b49] flex gap-3 shrink-0" style={{ background: "#0a1628" }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] text-sm font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl bg-[#FF6D00] hover:bg-[#e86200] text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50"
          >
            {saving ? "Guardando..." : product ? "Actualizar" : "Crear producto"}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function InventoryDashboard({
  products: initial,
  waConnected,
}: {
  products:    CatalogProduct[]
  waConnected: boolean
}) {
  const [products,    setProducts]    = useState<CatalogProduct[]>(initial)
  const [search,      setSearch]      = useState("")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [showPanel,   setShowPanel]   = useState(false)
  const [editing,     setEditing]     = useState<CatalogProduct | null>(null)
  const [syncing,     setSyncing]     = useState(false)
  const [syncMsg,     setSyncMsg]     = useState("")
  const [categories,  setCategories]  = useState<string[]>([])
  const [priceMax,    setPriceMax]    = useState<number | null>(null)

  // ── Custom categories ──
  const [customCats,    setCustomCats]    = useState<Category[]>([])
  const [showAddCat,    setShowAddCat]    = useState(false)
  const [newCatName,    setNewCatName]    = useState("")
  const [newCatColor,   setNewCatColor]   = useState("#b36dff")

  const CAT_PRESETS = ["#b36dff", "#40C4FF", "#00e5cc", "#FF6D00", "#ff4d8d", "#ffd700", "#4caf50", "#a3aac4"]

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sk_custom_cats")
      if (saved) setCustomCats(JSON.parse(saved))
    } catch {}
  }, [])

  const allCategories = useMemo(() => [...CATEGORIES, ...customCats], [customCats])

  function addCustomCat() {
    const name = newCatName.trim()
    if (!name) return
    const cat: Category = {
      id:    name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
      label: name,
      color: newCatColor,
    }
    const next = [...customCats, cat]
    setCustomCats(next)
    localStorage.setItem("sk_custom_cats", JSON.stringify(next))
    setNewCatName("")
    setShowAddCat(false)
  }

  function removeCustomCat(id: string) {
    const next = customCats.filter(c => c.id !== id)
    setCustomCats(next)
    localStorage.setItem("sk_custom_cats", JSON.stringify(next))
    setCategories(prev => prev.filter(c => c !== id))
  }

  const totalValuation = useMemo(() =>
    products.reduce((s, p) => s + (p.price ?? 0), 0), [products])
  const activeCount   = products.filter(p => p.enabled).length
  const inactiveCount = products.filter(p => !p.enabled).length
  const maxPrice      = useMemo(() =>
    Math.max(0, ...products.map(p => p.price ?? 0)), [products])

  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase())
    const matchStock =
      stockFilter === "all"    ? true :
      stockFilter === "active" ? p.enabled : !p.enabled
    const matchCat = categories.length === 0 || categories.includes(p.category ?? "")
    const matchPrice = priceMax === null || (p.price ?? 0) <= priceMax
    return matchSearch && matchStock && matchCat && matchPrice
  }), [products, search, stockFilter, categories, priceMax])

  function openCreate() { setEditing(null); setShowPanel(true) }
  function openEdit(p: CatalogProduct) { setEditing(p); setShowPanel(true) }

  function handleSaved(saved: CatalogProduct) {
    setProducts(prev =>
      editing ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]
    )
    setShowPanel(false)
    setEditing(null)
  }

  async function handleToggle(product: CatalogProduct) {
    const res  = await fetch(`/api/catalog/products/${product.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !product.enabled }),
    })
    const data = await res.json()
    if (!data.error) setProducts(prev => prev.map(p => p.id === product.id ? data : p))
  }

  async function handleDelete(product: CatalogProduct) {
    if (!confirm(`¿Eliminar "${product.name}"? No se puede deshacer.`)) return
    const res = await fetch(`/api/catalog/products/${product.id}`, { method: "DELETE" })
    if (res.ok) setProducts(prev => prev.filter(p => p.id !== product.id))
  }

  async function syncAll() {
    setSyncing(true)
    setSyncMsg("")
    const res  = await fetch("/api/catalog/sync-to-whatsapp", { method: "POST" })
    const data = await res.json()
    setSyncMsg(data.error
      ? `Error: ${data.error}`
      : `✅ ${data.synced} producto${data.synced !== 1 ? "s" : ""} sincronizados`)
    setSyncing(false)
    setTimeout(() => setSyncMsg(""), 5000)
  }

  function toggleCategory(id: string) {
    setCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  return (
    <>
      {showPanel && (
        <ProductPanel
          product={editing}
          allCategories={allCategories}
          onSave={handleSaved}
          onClose={() => { setShowPanel(false); setEditing(null) }}
        />
      )}

      <div className="min-h-screen w-full" style={{ background: "linear-gradient(160deg, #060e20 0%, #091328 100%)" }}>
        <div className="px-6 py-7 flex flex-col gap-7">

          {/* ── Search bar ── */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3aac4]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-8 pr-4 py-2.5 text-xs rounded-xl bg-[#060e20] border border-[#1f2b49] text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:border-[#FF6D00]/40 transition-all"
              />
            </div>
            {waConnected && (
              <button
                onClick={syncAll}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] text-xs font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Sincronizando..." : "Sync WA"}
              </button>
            )}
          </div>

          {syncMsg && (
            <p className="text-xs text-[#40C4FF] bg-[#40C4FF]/10 border border-[#40C4FF]/20 px-4 py-2.5 rounded-xl">{syncMsg}</p>
          )}

          {/* ── Metrics row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Valoración Total */}
            <div className="relative overflow-hidden rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#FF6D00]" />
              <Wallet size={56} className="absolute right-3 bottom-2 text-[#FF6D00]/6 pointer-events-none" />
              <p className={`${labelCls} mb-3`}>Valoración Total</p>
              <p className="text-3xl font-light text-[#dee5ff] mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                {products[0]?.currency ?? "USD"}&nbsp;{totalValuation.toLocaleString("es", { minimumFractionDigits: 0 })}
              </p>
              <div className="flex items-center gap-1.5">
                <ArrowUpRight size={12} className="text-[#40C4FF]" />
                <span className="text-xs text-[#40C4FF] font-semibold">{products.length} SKUs registrados</span>
              </div>
            </div>

            {/* Productos Activos */}
            <div className="relative overflow-hidden rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#40C4FF]" />
              <Zap size={56} className="absolute right-3 bottom-2 text-[#40C4FF]/6 pointer-events-none" />
              <p className={`${labelCls} mb-3`}>Productos Activos</p>
              <p className="text-3xl font-light text-[#dee5ff] mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>{activeCount}</p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#40C4FF] animate-pulse" />
                <span className="text-xs text-[#40C4FF] font-semibold">Visibles para el agente IA</span>
              </div>
            </div>

            {/* Alertas */}
            <div className="relative overflow-hidden rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${inactiveCount > 0 ? "bg-[#FF6D00]" : "bg-[#1f2b49]"}`} />
              <AlertTriangle size={56} className="absolute right-3 bottom-2 text-[#FF6D00]/6 pointer-events-none" />
              <p className={`${labelCls} mb-3`}>Alertas de Reposición</p>
              <p className="text-3xl font-light text-[#dee5ff] mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>{inactiveCount}</p>
              <p className="text-xs text-[#a3aac4]">
                {inactiveCount === 0
                  ? "Todo en orden"
                  : `${inactiveCount} producto${inactiveCount !== 1 ? "s" : ""} requiere${inactiveCount === 1 ? "" : "n"} atención`}
              </p>
            </div>
          </div>

          {/* ── Main workspace ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

            {/* Left sidebar */}
            <div className="flex flex-col gap-4">

              {/* Categorías */}
              <div className="rounded-xl border border-[#1f2b49] p-5" style={{ background: "#0a1628" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={13} className="text-[#a3aac4]" />
                    <p className={labelCls}>Categorías</p>
                  </div>
                  <button
                    onClick={() => setShowAddCat(v => !v)}
                    title="Añadir categoría"
                    className="w-6 h-6 flex items-center justify-center rounded-lg border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] hover:border-[#FF6D00]/40 transition-all"
                  >
                    {showAddCat ? <X size={11} /> : <Plus size={11} />}
                  </button>
                </div>

                {/* Add category form */}
                {showAddCat && (
                  <div className="mb-4 p-3 rounded-lg border border-[#1f2b49] flex flex-col gap-2.5" style={{ background: "#060e20" }}>
                    <input
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomCat() } }}
                      placeholder="Nombre de categoría"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0a1628] border border-[#1f2b49] text-xs text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:border-[#FF6D00]/50 transition-all"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {CAT_PRESETS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewCatColor(c)}
                          className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
                          style={{
                            background:   c,
                            borderColor:  newCatColor === c ? "#fff" : "transparent",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddCat(false); setNewCatName("") }}
                        className="flex-1 py-1.5 rounded-lg border border-[#1f2b49] text-[10px] text-[#a3aac4] hover:text-[#dee5ff] transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={addCustomCat}
                        disabled={!newCatName.trim()}
                        className="flex-1 py-1.5 rounded-lg bg-[#FF6D00] hover:bg-[#e86200] text-[10px] text-white font-semibold transition-all disabled:opacity-40"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  {allCategories.map(cat => {
                    const count    = products.filter(p => p.category === cat.id).length
                    const isCustom = customCats.some(c => c.id === cat.id)
                    if (count === 0 && !isCustom) return null
                    const active = categories.includes(cat.id)
                    return (
                      <div key={cat.id} className="flex items-center gap-1 group/cat">
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all flex-1 min-w-0 ${
                            active ? "bg-[#0d1a35]" : "hover:bg-[#0d1a35]/60"
                          }`}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded flex items-center justify-center border transition-all shrink-0"
                            style={active
                              ? { background: cat.color, borderColor: cat.color }
                              : { background: "transparent", borderColor: "#1f2b49" }}
                          >
                            {active && (
                              <svg width="8" height="6" viewBox="0 0 9 7" fill="none">
                                <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span
                            className="text-xs flex-1 truncate transition-colors"
                            style={{ color: active ? cat.color : "#a3aac4" }}
                          >
                            {cat.label}
                          </span>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                            style={active
                              ? { color: cat.color, background: `${cat.color}20` }
                              : { color: "#3a4460", background: "#0d1a35" }}
                          >
                            {count}
                          </span>
                        </button>
                        {isCustom && (
                          <button
                            onClick={() => removeCustomCat(cat.id)}
                            className="opacity-0 group-hover/cat:opacity-100 p-1 rounded-lg text-[#3a4460] hover:text-red-400 transition-all shrink-0"
                            title="Eliminar categoría"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {allCategories.every(c => products.filter(p => p.category === c.id).length === 0) && !showAddCat && (
                    <p className="text-[10px] text-[#3a4460] px-1 py-2">
                      Las categorías aparecen al asignarlas a productos
                    </p>
                  )}
                  {categories.length > 0 && (
                    <button
                      onClick={() => setCategories([])}
                      className="mt-1 text-[10px] text-[#FF6D00] hover:underline text-left px-1"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Estado de stock */}
              <div className="rounded-xl border border-[#1f2b49] p-5" style={{ background: "#0a1628" }}>
                <p className={`${labelCls} mb-4`}>Estado de Stock</p>
                <div className="flex flex-col gap-2">
                  {([
                    { key: "all",      label: "Todos",     count: products.length },
                    { key: "active",   label: "En Stock",  count: activeCount     },
                    { key: "inactive", label: "Agotado",   count: inactiveCount   },
                  ] as { key: StockFilter; label: string; count: number }[]).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setStockFilter(f.key)}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                        stockFilter === f.key
                          ? "bg-[#FF6D00]/15 border border-[#FF6D00]/30 text-[#FF6D00]"
                          : "text-[#a3aac4] hover:text-[#dee5ff] hover:bg-[#0d1a35] border border-[#1f2b49]"
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        stockFilter === f.key ? "bg-[#FF6D00]/20 text-[#FF6D00]" : "bg-[#1f2b49] text-[#a3aac4]"
                      }`}>{f.count}</span>
                    </button>
                  ))}
                </div>

                {waConnected && (
                  <>
                    <div className="h-px bg-[#1f2b49] my-4" />
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#40C4FF]/5 border border-[#40C4FF]/20">
                      <span className="h-2 w-2 rounded-full bg-[#40C4FF] animate-pulse shrink-0" />
                      <span className="text-[11px] text-[#40C4FF] font-semibold">WhatsApp conectado</span>
                    </div>
                  </>
                )}
              </div>

              {/* Rango de Precio */}
              {maxPrice > 0 && (
                <div className="rounded-xl border border-[#1f2b49] p-5" style={{ background: "#0a1628" }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className={labelCls}>Rango de Precio</p>
                    {priceMax !== null && (
                      <button
                        onClick={() => setPriceMax(null)}
                        className="text-[10px] text-[#FF6D00] hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxPrice}
                    step={Math.max(1, Math.round(maxPrice / 100))}
                    value={priceMax ?? maxPrice}
                    onChange={e => setPriceMax(Number(e.target.value))}
                    className="w-full accent-[#FF6D00] cursor-pointer"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-[#3a4460]">0</span>
                    <span className="text-[10px] text-[#FF6D00] font-semibold">
                      ≤ {(priceMax ?? maxPrice).toLocaleString("es")}
                    </span>
                  </div>
                </div>
              )}

              {/* Nuevo producto CTA */}
              <button
                onClick={openCreate}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FF6D00] hover:bg-[#e86200] text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-100"
              >
                <Plus size={15} />
                Nuevo Producto
              </button>
            </div>

            {/* Product registry */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#dee5ff]">Registro de Productos</h2>
                  <p className="text-[11px] text-[#a3aac4] mt-0.5">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={openCreate}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6D00] hover:bg-[#e86200] text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-100"
                >
                  <Plus size={13} /> Añadir Producto
                </button>
              </div>

              {/* Grid */}
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      waConnected={waConnected}
                      allCategories={allCategories}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[#1f2b49] py-20 flex flex-col items-center gap-3" style={{ background: "#0a1628" }}>
                  <Package size={40} className="text-[#1f2b49]" />
                  <p className="text-[#a3aac4] text-sm font-medium">
                    {search ? "No se encontraron productos" : "Sin productos en este filtro"}
                  </p>
                  {!search && (
                    <button onClick={openCreate} className="text-xs text-[#FF6D00] hover:underline mt-1">
                      Crear primer producto →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
