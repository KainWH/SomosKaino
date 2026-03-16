"use client"

import { useState } from "react"

type Props = {
  catalogId:     string | null
  isConfigured:  boolean   // tiene access_token
  rentiaCount:   number    // productos activos en RentIA
}

export default function WhatsappCatalogSource({ catalogId, isConfigured, rentiaCount }: Props) {
  const [id, setId]             = useState(catalogId ?? "")
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [syncedCount, setSynced] = useState<number | null>(null)
  const [message, setMessage]   = useState("")

  const isActive = !!catalogId

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")
    setSynced(null)

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
      setSynced(data.synced ?? 0)
      setMessage(data.message ?? "")
      setStatus("success")
    }
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar el catálogo de WhatsApp Business?")) return
    setId("")
    await fetch("/api/knowledge/whatsapp-catalog/sync", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ catalog_id: "" }),
    })
    setStatus("idle")
    setSynced(null)
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
            <h2 className="text-base font-semibold text-gray-900">Publicar en WhatsApp Business</h2>
            <p className="text-xs text-gray-500">
              Conecta tu catálogo de Meta para publicar los productos de RentIA ahí también
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          isActive && status !== "idle"
            ? "bg-green-50 text-green-700 border border-green-200"
            : isActive
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-gray-100 text-gray-500"
        }`}>
          {isActive ? "Conectado" : "Sin conectar"}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* Aviso: productos pendientes de subir */}
        {!isActive && rentiaCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-amber-800">
            <p className="font-medium">
              Tienes {rentiaCount} producto{rentiaCount > 1 ? "s" : ""} en tu catálogo RentIA
            </p>
            <p className="text-xs mt-0.5 text-amber-600">
              Al conectar el catálogo de WhatsApp Business, se subirán automáticamente todos.
            </p>
          </div>
        )}

        {!isConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
            Primero guarda tu <strong>Access Token de WhatsApp</strong> en{" "}
            <a href="/settings" className="underline font-medium">Configuración</a>.
          </div>
        )}

        {/* Form */}
        {!isActive ? (
          <form onSubmit={handleConnect} className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">ID del Catálogo de Meta</label>
              <p className="text-xs text-gray-400 mb-1">
                Meta Business Manager → Commerce → Catálogos → Configuración
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="ej: 1234567890123456"
                  disabled={!isConfigured}
                  required
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={!isConfigured || status === "loading" || !id.trim()}
                  className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {status === "loading"
                    ? "Conectando..."
                    : rentiaCount > 0
                    ? `Conectar y subir ${rentiaCount} producto${rentiaCount > 1 ? "s" : ""}`
                    : "Conectar catálogo"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-green-800">Catálogo conectado</p>
              <p className="text-xs text-green-600 mt-0.5">
                Los productos nuevos se publican automáticamente en WhatsApp
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
            >
              Desconectar
            </button>
          </div>
        )}

        {/* Resultado del sync */}
        {status === "success" && syncedCount !== null && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
            <p className="text-sm font-medium text-green-800">✅ {message || "Listo"}</p>
            {syncedCount > 0 && (
              <p className="text-xs text-green-600 mt-0.5">
                De ahora en adelante, cada producto que crees o edites en RentIA se publicará automáticamente.
              </p>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Instrucciones colapsadas */}
        <details className="text-xs">
          <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
            ¿Cómo obtener el ID del Catálogo?
          </summary>
          <ol className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-blue-700 space-y-0.5 list-decimal list-inside">
            <li>Ve a <span className="font-medium">business.facebook.com</span></li>
            <li>Abre <span className="font-medium">Commerce → Catálogos</span></li>
            <li>Selecciona tu catálogo → <span className="font-medium">Configuración</span></li>
            <li>Copia el <span className="font-medium">ID del catálogo</span></li>
          </ol>
        </details>

      </div>
    </section>
  )
}
