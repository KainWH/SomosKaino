import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function InventoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase.from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) redirect("/login")

  const { data: products } = await supabase
    .from("catalog_products")
    .select("id, name, price, currency, enabled, image_url")
    .eq("tenant_id", tenant.id)
    .order("name")

  const active   = (products ?? []).filter((p) => p.enabled)
  const inactive = (products ?? []).filter((p) => !p.enabled)

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Inventario</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Stock y estado de tus productos</p>
        </div>
        <Link href="/catalog" className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
          + Agregar producto
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl flex flex-col gap-6">

          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{(products ?? []).length}</p>
              <p className="text-sm text-gray-500 mt-1">Total productos</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <p className="text-2xl font-bold text-green-600">{active.length}</p>
              <p className="text-sm text-gray-500 mt-1">Activos</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <p className="text-2xl font-bold text-gray-400">{inactive.length}</p>
              <p className="text-sm text-gray-500 mt-1">Inactivos</p>
            </div>
          </div>

          {/* Lista */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden overflow-x-auto">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Todos los productos</h2>
            </div>
            {(products ?? []).length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <span className="text-4xl">📦</span>
                <p className="text-gray-500 text-sm">Sin productos en el catálogo</p>
                <Link href="/catalog" className="text-sm text-green-600 font-medium hover:underline">Ir a Catálogo →</Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50 dark:border-gray-800">
                    <th className="px-5 py-3 text-left font-medium">Producto</th>
                    <th className="px-5 py-3 text-right font-medium">Precio</th>
                    <th className="px-5 py-3 text-center font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {(products ?? []).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              : <span className="text-sm">📱</span>
                            }
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-400 font-medium">
                        {p.price != null ? `${p.currency ?? "RD$"} ${Number(p.price).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          p.enabled
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.enabled ? "bg-green-500" : "bg-gray-400"}`} />
                          {p.enabled ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href="/catalog" className="text-xs text-green-600 hover:underline font-medium">Editar</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Nota sobre stock */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-500 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              El control de stock con alertas y movimientos estará disponible próximamente.
              Por ahora puedes gestionar tus productos desde el <Link href="/catalog" className="font-semibold underline">Catálogo</Link>.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
