"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function InboxError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="h-full flex items-center justify-center bg-slate-950">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <p className="text-slate-200 font-semibold mb-1">Error al cargar el inbox</p>
        <p className="text-slate-500 text-sm mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors border border-slate-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
