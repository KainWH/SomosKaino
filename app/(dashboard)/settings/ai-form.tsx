"use client"

import { useState } from "react"
import type { AiConfig } from "@/types"

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-[#060e20] border border-[#1f2b49] text-sm text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:border-[#FF6D00]/50 focus:ring-2 focus:ring-[#FF6D00]/10 transition-all resize-none"

export default function AiForm({ config }: { config: AiConfig | null }) {
  const [systemPrompt, setSystemPrompt] = useState(config?.system_prompt ?? "")
  const [enabled, setEnabled]           = useState(config?.enabled ?? true)
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")

    const res = await fetch("/api/settings/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_prompt: systemPrompt, enabled }),
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
    <section className="rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
      <h2 className="text-lg font-semibold text-[#dee5ff] mb-1">Asistente IA</h2>
      <p className="text-sm text-[#a3aac4] mb-4">
        Define cómo responde tu asistente automático en WhatsApp
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <input
            id="enabled"
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            className="w-4 h-4 accent-[#FF6D00]"
          />
          <label htmlFor="enabled" className="text-sm font-medium text-[#dee5ff]">
            Respuestas automáticas activadas
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-[#dee5ff]">Prompt del sistema</label>
          <p className="text-xs text-[#a3aac4] mb-1.5">
            Instrucciones que definen la personalidad de tu asistente
          </p>
          <textarea
            rows={6}
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            placeholder="Eres un asistente amigable de bienes raíces..."
            required
            className={inputCls}
          />
        </div>

        {status === "success" && (
          <div className="bg-[#40C4FF]/10 border border-[#40C4FF]/25 text-[#40C4FF] text-sm px-3 py-2 rounded-lg">
            ✅ Configuración guardada
          </div>
        )}
        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="self-start bg-[#FF6D00] hover:bg-[#e86200] text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          {status === "loading" ? "Guardando..." : "Guardar prompt"}
        </button>
      </form>
    </section>
  )
}
