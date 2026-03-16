"use client"

import { useState } from "react"

type CatalogConfig = {
  sheet_url:  string | null
  sheet_id:   string | null
  sheet_gid:  string | null
  enabled?:   boolean | null
}

type ProductSummary = { productos: number; conFoto: number; sinFoto: number }

export default function SheetsSource({ config }: { config: CatalogConfig | null }) {
  const [sheetUrl, setSheetUrl]   = useState(config?.sheet_url ?? "")
  const [enabled, setEnabled]     = useState(config?.enabled ?? true)
  const [status, setStatus]       = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg]   = useState("")
  const [summary, setSummary]     = useState<ProductSummary | null>(null)

  const isActive = !!(config?.sheet_id && enabled)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")

    const res  = await fetch("/api/settings/catalog", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sheet_url: sheetUrl }),
    })
    const data = await res.json()

    if (data.error) {
      setErrorMsg(data.error)
      setStatus("error")
    } else {
      setSummary(data.summary)
      setStatus("success")
    }
  }

  async function toggleEnabled() {
    const next = !enabled
    setEnabled(next)
    // Persist toggle — re-upsert con enabled actualizado
    await fetch("/api/settings/catalog", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sheet_url: sheetUrl, enabled: next }),
    })
  }

  return (
    <section className="bg-white border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-lg">
            📊
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Inventario en Google Sheets</h2>
            <p className="text-xs text-gray-500">Hoja de cálculo con productos, precios e imágenes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {config?.sheet_id && (
            <button
              onClick={toggleEnabled}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                enabled ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${
                enabled ? "translate-x-4" : "translate-x-1"
              }`} />
            </button>
          )}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            isActive
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-100 text-gray-500"
          }`}>
            {isActive ? "Activo" : config?.sheet_id ? "Pausado" : "Sin configurar"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">URL del Google Sheet</label>
            <p className="text-xs text-gray-400 mb-1">
              Debe estar compartido como "Cualquiera con el enlace puede ver"
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                required
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
              >
                {status === "loading" ? "Verificando..." : "Conectar"}
              </button>
            </div>
          </div>
        </form>

        {config?.sheet_id && status === "idle" && (
          <div className="bg-gray-50 border rounded-lg px-3 py-2 text-xs text-gray-600 flex gap-4">
            <span><span className="font-medium">Sheet ID:</span> {config.sheet_id}</span>
            <span><span className="font-medium">Tab:</span> {config.sheet_gid ?? "0"}</span>
          </div>
        )}

        {status === "success" && summary && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-green-800 mb-2">✅ Sheet conectado y verificado</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-green-700">{summary.productos}</p>
                <p className="text-xs text-green-600">Productos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-700">{summary.conFoto}</p>
                <p className="text-xs text-green-600">Con foto</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-500">{summary.sinFoto}</p>
                <p className="text-xs text-gray-400">Sin foto</p>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 space-y-0.5">
          <p className="font-medium">Formato requerido del Sheet:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Columna con nombre del producto (ej: "Modelo", "Nombre")</li>
            <li>Columna con URL de imagen en Drive (ej: "Imagen Url")</li>
            <li>Las imágenes en Drive también deben ser públicas</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
