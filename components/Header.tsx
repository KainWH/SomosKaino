"use client"

import { Bell, Search } from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
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
  const [greeting, setGreeting]         = useState("")
  const [dateFormatted, setDateFormatted] = useState("")

  useEffect(() => {
    setGreeting(getGreeting())
    setDateFormatted(getFormattedDate())
  }, [])

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4 shrink-0">

      {/* Saludo */}
      <div className="flex-1 min-w-0 hidden md:block">
        <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 truncate">
          {greeting ? `${greeting}, ${name} 👋` : ""}
        </p>
        <p className="text-[10px] text-gray-400 truncate">{dateFormatted}</p>
      </div>

      {/* Búsqueda */}
      <div className="flex-1 max-w-sm relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar productos, clientes, pedidos..."
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:placeholder-gray-500 transition"
        />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 ml-auto">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors">
          <Bell size={16} strokeWidth={1.75} />
          {/* Indicador rojo */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
