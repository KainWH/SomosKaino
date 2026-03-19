"use client"

import { useState } from "react"
import type { WhatsappConfig } from "@/types"

type VerifyResult = {
  ok: boolean
  displayPhoneNumber?: string
  verifiedName?: string
  qualityRating?: string
  error?: string
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-[#060e20] border border-[#1f2b49] text-sm text-[#dee5ff] placeholder-[#3a4460] focus:outline-none focus:border-[#FF6D00]/50 focus:ring-2 focus:ring-[#FF6D00]/10 transition-all"

export default function WhatsappForm({ config }: { config: WhatsappConfig | null }) {
  const [phoneNumberId, setPhoneNumberId] = useState(config?.phone_number_id ?? "")
  const [accessToken, setAccessToken]     = useState("")
  const [status, setStatus]   = useState<"idle" | "saving" | "verifying" | "connected" | "error">("idle")
  const [errorMsg, setErrorMsg]     = useState("")
  const [verified, setVerified]     = useState<VerifyResult | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("saving")
    setVerified(null)

    const saveRes = await fetch("/api/settings/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone_number_id: phoneNumberId,
        access_token:    accessToken,
      }),
    })

    const saveData = await saveRes.json()
    if (saveData.error) {
      setErrorMsg(saveData.error)
      setStatus("error")
      return
    }

    setStatus("verifying")
    const verifyRes  = await fetch("/api/settings/whatsapp/verify")
    const verifyData: VerifyResult = await verifyRes.json()

    setVerified(verifyData)
    setStatus(verifyData.ok ? "connected" : "error")
    if (!verifyData.ok) setErrorMsg(verifyData.error ?? "No se pudo verificar la conexión")
  }

  return (
    <section className="rounded-xl border border-[#1f2b49] p-6" style={{ background: "#0a1628" }}>
      <h2 className="text-lg font-semibold text-[#dee5ff] mb-1">WhatsApp Business</h2>
      <p className="text-sm text-[#a3aac4] mb-4">
        Ingresa las credenciales de tu app en{" "}
        <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#40C4FF] hover:underline">
          Meta for Developers
        </a>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-[#dee5ff]">Phone Number ID</label>
          <p className="text-xs text-[#a3aac4] mb-1.5">Meta Developer → Tu App → WhatsApp → API Setup → Phone Number ID</p>
          <input
            type="text"
            value={phoneNumberId}
            onChange={e => setPhoneNumberId(e.target.value)}
            placeholder="123456789012345"
            required
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[#dee5ff]">Access Token</label>
          <p className="text-xs text-[#a3aac4] mb-1.5">Meta Developer → Tu App → WhatsApp → API Setup → Token</p>
          {config?.is_configured && (
            <p className="text-xs text-[#40C4FF] mb-1.5">● Token ya configurado — deja vacío para mantenerlo</p>
          )}
          <input
            type="password"
            value={accessToken}
            onChange={e => setAccessToken(e.target.value)}
            placeholder={config?.is_configured ? "••••••••••••••••" : "EAABsbCS..."}
            required={!config?.is_configured}
            className={inputCls}
          />
        </div>

        {status === "connected" && verified?.ok && (
          <div className="bg-[#40C4FF]/10 border border-[#40C4FF]/25 rounded-lg px-4 py-3 flex flex-col gap-0.5">
            <p className="text-[#40C4FF] text-sm font-semibold">✅ Conectado con Meta</p>
            {verified.verifiedName && (
              <p className="text-[#40C4FF]/80 text-xs">Cuenta: <span className="font-medium">{verified.verifiedName}</span></p>
            )}
            {verified.displayPhoneNumber && (
              <p className="text-[#40C4FF]/80 text-xs">Número: <span className="font-medium">{verified.displayPhoneNumber}</span></p>
            )}
            {verified.qualityRating && (
              <p className="text-[#40C4FF]/80 text-xs">Calidad: <span className="font-medium">{verified.qualityRating}</span></p>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
            ❌ {errorMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "saving" || status === "verifying"}
            className="bg-[#FF6D00] hover:bg-[#e86200] text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            {status === "saving"    ? "Guardando..."    :
             status === "verifying" ? "Verificando..."  : "Guardar y verificar"}
          </button>
          {config?.is_configured && status === "idle" && (
            <span className="text-xs text-[#40C4FF] font-medium">● Configurado</span>
          )}
        </div>
      </form>
    </section>
  )
}
