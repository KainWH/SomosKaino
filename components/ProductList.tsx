import Link from "next/link"
import { ChevronRight, AlertTriangle, Smartphone, Laptop, Headphones, Tablet, Tv, Package } from "lucide-react"
import { LucideIcon } from "lucide-react"

type Product = {
  id:        string
  name:      string
  price:     number | null
  currency:  string | null
  enabled:   boolean
  image_url: string | null
  stock?:    number | null
}

function getCategoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes("phone") || n.includes("celular") || n.includes("samsung") || n.includes("iphone") || n.includes("móvil")) return Smartphone
  if (n.includes("laptop") || n.includes("computadora") || n.includes("pc") || n.includes("mac")) return Laptop
  if (n.includes("auricular") || n.includes("headphone") || n.includes("audifonos") || n.includes("earphone")) return Headphones
  if (n.includes("tablet") || n.includes("ipad")) return Tablet
  if (n.includes("tv") || n.includes("televisor") || n.includes("monitor")) return Tv
  return Package
}

function formatDOP(price: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 0 }).format(price)
}

const LOW_STOCK = 5

export default function ProductList({ products }: { products: Product[] }) {
  const list = products.slice(0, 10)

  return (
    <div className="flex-1 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Productos</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{products.length} en catálogo</p>
        </div>
        <Link href="/catalog" className="text-[11px] text-blue-400 font-medium flex items-center gap-0.5 hover:text-blue-300 transition-colors">
          Ver todos <ChevronRight size={11} />
        </Link>
      </div>

      <div className="divide-y divide-slate-800/40 flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-slate-600">
            <Package size={26} strokeWidth={1.5} />
            <p className="text-sm">Sin productos aún</p>
            <Link href="/catalog" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Agregar producto →
            </Link>
          </div>
        ) : (
          list.map((p) => {
            const Icon     = getCategoryIcon(p.name)
            const lowStock = p.stock != null && p.stock <= LOW_STOCK

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/30 transition-colors duration-150"
              >
                {/* Imagen / icono */}
                <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center shrink-0 overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon size={16} strokeWidth={1.5} className="text-slate-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-300 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.stock != null && (
                      <span className="text-[10px] text-slate-600">Stock: {p.stock}</span>
                    )}
                    {lowStock && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                        <AlertTriangle size={8} />
                        Stock bajo
                      </span>
                    )}
                  </div>
                </div>

                {/* Precio */}
                {p.price != null && (
                  <span className="text-[13px] font-semibold text-slate-300 shrink-0">
                    {p.currency === "DOP" || !p.currency
                      ? formatDOP(p.price)
                      : `${p.currency} ${p.price.toLocaleString()}`}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
