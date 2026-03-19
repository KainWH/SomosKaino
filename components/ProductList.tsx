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
    <div className="h-full flex flex-col rounded-2xl border border-[#1f2b49] overflow-hidden" style={{ background: "#0a1628" }}>
      <div className="px-5 py-4 border-b border-[#1f2b49] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#dee5ff]">Productos</h2>
          <p className="text-[11px] text-[#a3aac4] mt-0.5">{products.length} en catálogo</p>
        </div>
        <Link href="/catalog" className="text-[11px] text-[#40C4FF] font-medium flex items-center gap-0.5 hover:text-[#40C4FF]/80 transition-colors">
          Ver todos <ChevronRight size={11} />
        </Link>
      </div>

      <div className="divide-y divide-[#1f2b49]/60 flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-[#3a4460]">
            <Package size={26} strokeWidth={1.5} />
            <p className="text-sm">Sin productos aún</p>
            <Link href="/catalog" className="text-xs text-[#40C4FF] hover:text-[#40C4FF]/80 transition-colors">
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
                className="flex items-center gap-3 px-5 py-3 hover:bg-[#0d1a35] transition-colors duration-150"
              >
                {/* Imagen / icono */}
                <div className="w-9 h-9 rounded-xl bg-[#0d1a35] border border-[#1f2b49] flex items-center justify-center shrink-0 overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon size={16} strokeWidth={1.5} className="text-[#a3aac4]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#dee5ff] truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.stock != null && (
                      <span className="text-[10px] text-[#3a4460]">Stock: {p.stock}</span>
                    )}
                    {lowStock && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#FF6D00] bg-[#FF6D00]/10 border border-[#FF6D00]/20 px-1.5 py-0.5 rounded-full">
                        <AlertTriangle size={8} />
                        Stock bajo
                      </span>
                    )}
                  </div>
                </div>

                {/* Precio */}
                {p.price != null && (
                  <span className="text-[13px] font-semibold text-[#dee5ff] shrink-0">
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
