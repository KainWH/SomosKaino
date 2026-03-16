import { MessageCircle } from "lucide-react"

export default function InboxPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-4">
          <MessageCircle size={36} className="text-slate-600" strokeWidth={1.5} />
        </div>
        <p className="text-slate-400 font-medium">Selecciona una conversación</p>
        <p className="text-slate-600 text-sm mt-1">Elige un chat de la lista para empezar</p>
      </div>
    </div>
  )
}
