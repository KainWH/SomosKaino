"use client"

import { useState } from "react"
import type { WhatsappConfig } from "@/types"

export default function WhatsappForm({ config }: { config: WhatsappConfig | null }) {
  const [phoneNumberId, setPhoneNumberId] = useState(config?.phone_number_id ?? "")
  const [accessToken, setAccessToken]     = useState(config?.access_token ?? "")
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")

    const res = await fetch("/api/settings/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone_number_id: phoneNumberId,
        access_token:    accessToken,
      }),
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
      <h2 className="text-lg font-semibold text-gray-900 mb-1">WhatsApp Business</h2>
      <p className="text-sm text-gray-500 mb-4">
        Ingresa las credenciales de tu app en{" "}
        <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
          Meta for Developers
        </a>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Phone Number ID</label>
          <p className="text-xs text-gray-400 mb-1">Meta Developer → Tu App → WhatsApp → API Setup → Phone Number ID</p>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="123456789012345"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Access Token</label>
          <p className="text-xs text-gray-400 mb-1">Meta Developer → Tu App → WhatsApp → API Setup → Token</p>
          <input
            type="text"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="EAABsbCS..."
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {status === "success" && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
            ✅ Configuración guardada
          </div>
        )}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {status === "loading" ? "Guardando..." : "Guardar"}
          </button>
          {config?.is_configured && status === "idle" && (
            <span className="text-xs text-green-600 font-medium">● Conectado</span>
          )}
        </div>
      </form>
    </section>
  )
}
