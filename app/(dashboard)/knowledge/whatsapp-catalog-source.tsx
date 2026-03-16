"use client"

import { useState } from "react"
import type { WACatalogProduct } from "@/lib/whatsapp-catalog"

type Props = {
  catalogId:    string | null
  isConfigured: boolean  // si WhatsApp está configurado (tiene access_token)
}

export default function WhatsappCatalogSource({ catalogId, isConfigured }: Props) {
  const [id, setId]           = useState(catalogId ?? "")
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [products, setProducts] = useState<WACatalogProduct[] | null>(null)

  const isActive = !!catalogId

  async function handleSync(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")

    const res  = await fetch("/api/knowledge/whatsapp-catalog/sync", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ catalog_id: id }),
    })
    const data = await res.json()

    if (data.error) {
      setErrorMsg(data.error)
      setStatus("error")
    } else {
      setProducts(data.products)
      setStatus("success")
    }
  }

  return (
    <section className="bg-white border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg">
            🛍️
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Catálogo de WhatsApp Business</h2>
            <p className="text-xs text-gray-500">Productos de tu catálogo de Meta Commerce Manager</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          isActive
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-gray-100 text-gray-500"
        }`}>
          {isActive ? "Activo" : "Sin configurar"}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4">
        {!isConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
            Primero conecta tu cuenta de WhatsApp en <strong>Configuración</strong> para poder usar el catálogo de Meta.
          </div>
        )}

        <form onSubmit={handleSync} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">ID del Catálogo</label>
            <p className="text-xs text-gray-400 mb-1">
              Encuéntralo en Meta Business Manager → Commerce → Catálogos → Configuración
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="ej: 1234567890123456"
                disabled={!isConfigured}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                type="submit"
                disabled={!isConfigured || status === "loading"}
                className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
              >
                {status === "loading" ? "Sincronizando..." : "Sincronizar"}
              </button>
            </div>
          </div>

          {id && (
            <button
              type="button"
              onClick={() => { setId(""); handleSync({ preventDefault: () => {} } as React.FormEvent) }}
              className="self-start text-xs text-red-500 hover:text-red-700"
            >
              Desconectar catálogo
            </button>
          )}
        </form>

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        {status === "success" && products !== null && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-green-700 font-medium">
              ✅ {products.length} productos sincronizados
            </p>
            {products.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {products.slice(0, 6).map((p) => (
                  <div key={p.id} className="border rounded-lg overflow-hidden">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-20 object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-full h-20 bg-gray-100 flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      {p.price != null && (
                        <p className="text-xs text-gray-500">
                          ${(p.price / 100).toFixed(2)} {p.currency}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {products.length > 6 && (
              <p className="text-xs text-gray-500">+{products.length - 6} productos más en el catálogo</p>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
          <p className="font-medium mb-1">¿Cómo obtener el ID del Catálogo?</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Entra a <span className="font-medium">business.facebook.com</span></li>
            <li>Ve a <span className="font-medium">Commerce → Catálogos</span></li>
            <li>Selecciona tu catálogo → <span className="font-medium">Configuración</span></li>
            <li>Copia el <span className="font-medium">ID del catálogo</span></li>
          </ol>
        </div>
      </div>
    </section>
  )
}
