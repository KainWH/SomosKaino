import { Phone, Calendar, Bot, PauseCircle, UserCheck, MessageSquare } from "lucide-react"
import Link from "next/link"
import ProductSearch from "./product-search"

type Props = {
  displayName:    string
  phone:          string
  avatarColor:    string
  aiPaused:       boolean
  status:         string
  conversationId: string
}

const QUICK_ACTIONS = [
  { label: "Agendar visita",       icon: Calendar,      color: "text-blue-400",   bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20" },
  { label: "Solicitar documentos", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20" },
]

export default function LeadDetails({ displayName, phone, avatarColor, aiPaused, status, conversationId }: Props) {
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="w-72 shrink-0 border-l border-slate-800/60 bg-slate-900/50 flex flex-col overflow-y-auto">

      {/* Perfil */}
      <div className="p-5 border-b border-slate-800/60 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg text-white text-xl font-bold"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <p className="text-base font-semibold text-slate-200">{displayName}</p>
        <p className="text-xs text-slate-500 mt-0.5">{phone}</p>

        <div className="flex items-center justify-center gap-2 mt-3">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            status === "open"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-slate-700/50 text-slate-400 border-slate-700"
          }`}>
            {status === "open" ? "Activa" : "Cerrada"}
          </span>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            aiPaused
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-green-500/10 text-green-400 border-green-500/20"
          }`}>
            {aiPaused ? "⏸ Bot pausado" : "🤖 IA activa"}
          </span>
        </div>
      </div>

      {/* Customer Insight */}
      <div className="p-4 border-b border-slate-800/60">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Customer Insight</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <UserCheck size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-600">Contacto</p>
              <p className="text-xs font-medium text-slate-300">{phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Phone size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-600">Canal</p>
              <p className="text-xs font-medium text-slate-300">WhatsApp Business</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              {aiPaused ? <PauseCircle size={14} className="text-amber-400" /> : <Bot size={14} className="text-purple-400" />}
            </div>
            <div>
              <p className="text-[10px] text-slate-600">Agente IA</p>
              <p className="text-xs font-medium text-slate-300">{aiPaused ? "Handover a humano" : "Respondiendo"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* IA Quick Actions */}
      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Acciones rápidas</p>
        <div className="flex flex-col gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border text-left transition-all duration-150 ${action.bg}`}
            >
              <action.icon size={15} className={action.color} />
              <span className={`text-xs font-medium ${action.color}`}>{action.label}</span>
            </button>
          ))}

          {/* Buscador de productos */}
          <div className="mt-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Enviar producto</p>
            <ProductSearch conversationId={conversationId} />
          </div>
        </div>

        <Link
          href={`/contacts`}
          className="flex items-center justify-center gap-2 w-full mt-3 px-3 py-2.5 rounded-xl border border-slate-700/40 bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-xs font-medium text-slate-400 hover:text-slate-200"
        >
          Ver perfil completo
        </Link>
      </div>
    </div>
  )
}
