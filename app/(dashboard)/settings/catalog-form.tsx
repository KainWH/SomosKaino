"use client"

import { useState } from "react"

type CatalogConfig = {
  sheet_url:  string | null
  sheet_id:   string | null
  sheet_gid:  string | null
}

export default function CatalogForm({ config }: { config: CatalogConfig | null }) {
  const [sheetUrl, setSheetUrl] = useState(config?.sheet_url ?? "")
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")

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
      setStatus("success")
    }
  }

  return (
    <section className="bg-white border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Catálogo de Productos</h2>
      <p className="text-sm text-gray-500 mb-4">
        Conecta tu Google Sheet con el inventario. La IA lo usará para responder preguntas
        y enviar fotos de productos. Las imágenes deben estar en Google Drive con enlace público.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">URL del Google Sheet</label>
          <p className="text-xs text-gray-400 mb-1">
            Pega la URL completa de tu hoja de cálculo
          </p>
          <input
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {config?.sheet_id && (
          <div className="bg-gray-50 border rounded-lg px-3 py-2 text-xs text-gray-500 space-y-1">
            <p><span className="font-medium">Sheet ID:</span> {config.sheet_id}</p>
            <p><span className="font-medium">Tab GID:</span> {config.sheet_gid ?? "0"}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 space-y-1">
          <p className="font-medium">Requisitos del Sheet:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Debe estar compartido como "Cualquiera con el enlace puede ver"</li>
            <li>Columna con nombre del producto (ej: "Modelo / Nombre")</li>
            <li>Columna con URL de Drive (ej: "Imagen Url")</li>
            <li>Las imágenes en Drive también deben ser públicas</li>
          </ul>
        </div>

        {status === "success" && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
            ✅ Catálogo configurado correctamente
          </div>
        )}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="self-start bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {status === "loading" ? "Guardando..." : "Guardar catálogo"}
        </button>
      </form>
    </section>
  )
}
