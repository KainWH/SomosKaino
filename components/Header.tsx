"use client"

import { Bell, Settings, X, MessageCircle, Users } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

// ── Page meta ─────────────────────────────────────────────────────────────────

const PAGE_META: Record<string, { title: string; sub: string }> = {
  "/dashboard":  { title: "Dashboard",         sub: "Resumen general de tu negocio"        },
  "/inbox":      { title: "WhatsApp",           sub: "Conversaciones y mensajes"            },
  "/contacts":   { title: "Clientes",           sub: "Base de contactos y leads"            },
  "/orders":     { title: "Pedidos",            sub: "Gestión de órdenes y envíos"          },
  "/inventory":  { title: "Inventario",         sub: "Productos y catálogo"                 },
  "/reports":    { title: "Reportes",           sub: "Métricas y análisis de tu negocio"    },
  "/knowledge":  { title: "IA & Conocimiento",  sub: "Base de conocimiento del agente"      },
  "/settings":   { title: "Configuración",      sub: "Ajustes de cuenta e integraciones"    },
}

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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "ahora"
  if (mins < 60) return `hace ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24)   return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

// ── Notification types ────────────────────────────────────────────────────────

type ApiNotif = {
  id:         string
  type:       "message" | "contact"
  title:      string
  sub:        string
  created_at: string
}

const TYPE_META = {
  message: { Icon: MessageCircle, color: "text-[#40C4FF]", bg: "bg-[#40C4FF]/10" },
  contact: { Icon: Users,         color: "text-[#FF6D00]", bg: "bg-[#FF6D00]/10" },
}

const READ_KEY = "sk_notifs_read"

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")) }
  catch { return new Set() }
}
function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
}

// ── Notification panel ────────────────────────────────────────────────────────

function NotificationPanel({
  notifs, readIds, onMarkRead, onMarkAll, onClose,
}: {
  notifs:    ApiNotif[]
  readIds:   Set<string>
  onMarkRead: (id: string) => void
  onMarkAll:  () => void
  onClose:    () => void
}) {
  const unread = notifs.filter(n => !readIds.has(n.id)).length

  return (
    <div
      className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[#1f2b49] shadow-2xl overflow-hidden"
      style={{ background: "#0a1628" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1f2b49]">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-[#dee5ff]">Notificaciones</p>
          {unread > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF6D00]/20 text-[#FF6D00] border border-[#FF6D00]/30">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={onMarkAll}
              className="text-[10px] text-[#40C4FF] hover:underline font-semibold"
            >
              Marcar todas
            </button>
          )}
          <button onClick={onClose} className="text-[#a3aac4] hover:text-[#dee5ff] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-[#1f2b49] max-h-72 overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Bell size={24} className="text-[#1f2b49]" />
            <p className="text-xs text-[#3a4460]">Sin notificaciones en las últimas 24h</p>
          </div>
        ) : notifs.map(n => {
          const meta = TYPE_META[n.type] ?? TYPE_META.message
          const isRead = readIds.has(n.id)
          return (
            <div
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-[#0d1a35] ${isRead ? "opacity-50" : ""}`}
            >
              <div className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <meta.Icon size={13} className={meta.color} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#dee5ff] leading-snug">{n.title}</p>
                <p className="text-[10px] text-[#a3aac4] mt-0.5 truncate">{n.sub}</p>
                <p className="text-[10px] text-[#3a4460] mt-0.5">{timeAgo(n.created_at)}</p>
              </div>
              {!isRead && <span className="w-2 h-2 rounded-full bg-[#FF6D00] shrink-0 mt-1.5" />}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1f2b49]">
        <p className="text-[10px] text-center text-[#3a4460]">
          Solo se muestran las últimas 24 horas
        </p>
      </div>
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

export default function Header({ name }: { name: string }) {
  const [greeting,    setGreeting]   = useState("")
  const [dateStr,     setDateStr]    = useState("")
  const [showNotifs,  setShowNotifs] = useState(false)
  const [notifs,      setNotifs]     = useState<ApiNotif[]>([])
  const [readIds,     setReadIds]    = useState<Set<string>>(new Set())
  const pathname  = usePathname()
  const notifRef  = useRef<HTMLDivElement>(null)

  const inConversation = pathname.startsWith("/inbox/")
  const initials       = name.slice(0, 2).toUpperCase()

  const rootPath   = "/" + (pathname.split("/")[1] ?? "")
  const meta       = PAGE_META[rootPath] ?? { title: "SomosKaino", sub: "" }
  const isDashboard = rootPath === "/dashboard"

  const unreadCount = notifs.filter(n => !readIds.has(n.id)).length

  // Init greeting + date
  useEffect(() => {
    setGreeting(getGreeting())
    setDateStr(getFormattedDate())
  }, [])

  // Load read IDs from localStorage
  useEffect(() => {
    setReadIds(getReadIds())
  }, [])

  // Fetch real notifications
  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setNotifs(data) })
      .catch(() => {})
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    if (showNotifs) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showNotifs])

  function markRead(id: string) {
    setReadIds(prev => {
      const next = new Set(prev).add(id)
      saveReadIds(next)
      return next
    })
  }

  function markAll() {
    setReadIds(prev => {
      const next = new Set(prev)
      notifs.forEach(n => next.add(n.id))
      saveReadIds(next)
      return next
    })
  }

  return (
    <header
      className={`relative z-50 h-14 flex items-center gap-4 shrink-0 pr-4 md:pr-6 border-b border-[#1f2b49] ${
        inConversation ? "pl-4" : "pl-14 md:pl-6"
      }`}
      style={{ background: "rgba(10,22,40,0.85)", backdropFilter: "blur(12px)" }}
    >
      {/* Left: page title or greeting */}
      <div className="flex-1 min-w-0">
        {isDashboard ? (
          <p className="text-[15px] font-semibold text-[#dee5ff] truncate">
            {greeting ? `${greeting}, ${name}` : ""}
          </p>
        ) : (
          <p className="text-[15px] font-bold text-[#dee5ff] truncate">{meta.title}</p>
        )}
        <p className="text-[11px] text-[#a3aac4] truncate mt-0.5 hidden md:block">
          {isDashboard ? dateStr : meta.sub}
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs(v => !v)}
            className={`relative w-8 h-8 flex items-center justify-center rounded-xl border transition-all duration-200 ${
              showNotifs
                ? "border-[#FF6D00]/40 bg-[#FF6D00]/10 text-[#FF6D00]"
                : "border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] hover:border-[#2a3a5c]"
            }`}
          >
            <Bell size={15} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6D00] rounded-full" />
            )}
          </button>
          {showNotifs && (
            <NotificationPanel
              notifs={notifs}
              readIds={readIds}
              onMarkRead={markRead}
              onMarkAll={markAll}
              onClose={() => setShowNotifs(false)}
            />
          )}
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#1f2b49] text-[#a3aac4] hover:text-[#dee5ff] hover:border-[#2a3a5c] transition-all duration-200"
          title="Configuración"
        >
          <Settings size={15} strokeWidth={1.75} />
        </Link>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white cursor-default select-none"
          style={{ background: "linear-gradient(135deg, #FF6D00 0%, #e86200 100%)" }}
          title={name}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
