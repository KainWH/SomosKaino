"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Send, Package } from "lucide-react"
import { useRouter } from "next/navigation"

type Product = {
  id:          string
  name:        string
  price:       number | null
  currency:    string | null
  description: string | null
  image_url:   string | null
}

function formatPrice(price: number, currency: string | null) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: currency === "DOP" || !currency ? "DOP" : currency,
    minimumFractionDigits: 0,
  }).format(price)
}

export default function ProductSearch({ conversationId }: { conversationId: string }) {
  const [query, setQuery]       = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [open, setOpen]         = useState(false)
  const [sending, setSending]   = useState<string | null>(null)
  const router  = useRouter()
  const ref     = useRef<HTMLDivElement>(null)

  // Carga productos una vez
  useEffect(() => {
    fetch("/api/catalog/products")
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => {})
  }, [])

  // Filtra por query
  useEffect(() => {
    if (!query.trim()) { setFiltered([]); setOpen(false); return }
    const q = query.toLowerCase()
    const results = products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5)
    setFiltered(results)
    setOpen(results.length > 0)
  }, [query, products])

  // Cierra al click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  async function sendProduct(product: Product) {
    setSending(product.id)
    const lines = [`*${product.name}*`]
    if (product.description) lines.push(product.description)
    if (product.price != null) lines.push(`💰 Precio: ${formatPrice(product.price, product.currency)}`)
    const message = lines.join("\n")

    const res = await fetch(`/api/conversations/${conversationId}/send-product`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ imageUrl: product.image_url ?? null, message }),
    })

    if (res.ok) {
      setQuery("")
      setOpen(false)
      router.refresh()
    }
    setSending(null)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => filtered.length > 0 && setOpen(true)}
          placeholder="Buscar producto para enviar..."
          className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-800/60 border border-slate-700/40 rounded-xl
            text-slate-300 placeholder-slate-600
            focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/40 transition-all"
        />
      </div>

      {/* Dropdown de resultados */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-800 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl z-50">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/60 transition-colors cursor-pointer border-b border-slate-700/40 last:border-0"
            >
              {/* Imagen o icono */}
              <div className="w-9 h-9 rounded-lg bg-slate-700/60 border border-slate-600/40 flex items-center justify-center shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={14} className="text-slate-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{product.name}</p>
                {product.price != null && (
                  <p className="text-[10px] text-slate-500">{formatPrice(product.price, product.currency)}</p>
                )}
              </div>

              {/* Botón enviar */}
              <button
                onClick={() => sendProduct(product)}
                disabled={sending === product.id}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-40 shrink-0"
              >
                {sending === product.id
                  ? <span className="text-[10px] font-bold">...</span>
                  : <Send size={12} />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
