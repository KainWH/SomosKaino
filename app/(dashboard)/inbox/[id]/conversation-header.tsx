"use client"

import { useState } from "react"
import Link from "next/link"

type Props = {
  conversationId: string
  displayName: string
  phone: string
  status: string
  aiPaused: boolean
  avatarColor: string
}

export default function ConversationHeader({
  conversationId,
  displayName,
  phone,
  status,
  aiPaused: initialAiPaused,
  avatarColor,
}: Props) {
  const [aiPaused, setAiPaused] = useState(initialAiPaused)
  const [loading, setLoading]   = useState(false)

  async function toggleBot() {
    setLoading(true)
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ai_paused: !aiPaused }),
    })
    if (res.ok) setAiPaused(!aiPaused)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b flex-shrink-0 shadow-sm">
      <Link
        href="/inbox"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        ←
      </Link>

      {/* Avatar con color único por contacto */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
        style={{ backgroundColor: avatarColor }}
      >
        {displayName[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{displayName}</p>
        <p className="text-xs text-gray-400">{phone}</p>
      </div>

      {/* Toggle del bot */}
      <button
        onClick={toggleBot}
        disabled={loading}
        className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
          aiPaused
            ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
            : "bg-green-50 text-green-700 hover:bg-green-100"
        }`}
      >
        <span>{aiPaused ? "⏸" : "🤖"}</span>
        <span>{aiPaused ? "Bot pausado" : "Bot activo"}</span>
      </button>

      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
        status === "open" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
      }`}>
        {status === "open" ? "Activa" : status}
      </span>
    </div>
  )
}
