"use client"

import { Bell } from "lucide-react"
import { useState, useEffect } from "react"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

function getFormattedDate() {
  const d = new Date().toLocaleDateString("es-DO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
  return d.charAt(0).toUpperCase() + d.slice(1)
}

export default function Header({ name }: { name: string }) {
  const [greeting, setGreeting]           = useState("")
  const [dateFormatted, setDateFormatted] = useState("")

  useEffect(() => {
    setGreeting(getGreeting())
    setDateFormatted(getFormattedDate())
  }, [])

  return (
    <header className="h-14 bg-slate-900/70 backdrop-blur-xl border-b border-slate-800/60 flex items-center pl-14 pr-6 md:px-6 gap-4 shrink-0">

      {/* Saludo */}
      <div className="flex-1 min-w-0 hidden md:block">
        <p className="text-[15px] font-semibold text-slate-200 truncate">
          {greeting ? `${greeting}, ${name} 👋` : ""}
        </p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{dateFormatted}</p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 ml-auto">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-xl text-slate-500
          hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-150">
          <Bell size={15} strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
