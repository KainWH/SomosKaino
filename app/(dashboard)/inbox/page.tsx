// Inbox — lista de conversaciones

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function InboxPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) redirect("/login")

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id,
      status,
      updated_at,
      contacts ( id, name, phone ),
      messages ( content, direction, sent_by_ai, created_at )
    `)
    .eq("tenant_id", tenant.id)
    .order("updated_at", { ascending: false })

  // Función para formatear la fecha de forma relativa
  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now  = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    if (isYesterday) return "Ayer"
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-gray-500 text-sm">
          {conversations?.length
            ? `${conversations.length} conversación${conversations.length !== 1 ? "es" : ""}`
            : "Todas tus conversaciones de WhatsApp"}
        </p>
      </div>

      {!conversations || conversations.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-gray-900 font-medium">Aún no hay conversaciones</p>
          <p className="text-gray-400 text-sm mt-1">
            Conecta tu número de WhatsApp en{" "}
            <Link href="/settings" className="text-green-600 hover:underline">Configuración</Link>
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden divide-y">
          {conversations.map((conv) => {
            const contact = Array.isArray(conv.contacts) ? conv.contacts[0] : conv.contacts
            const displayName = contact?.name ?? contact?.phone ?? "Desconocido"

            // Obtener el último mensaje
            const msgs = Array.isArray(conv.messages) ? conv.messages : []
            const lastMsg = msgs.sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]

            const preview = lastMsg
              ? `${lastMsg.direction === "outbound" ? "Tú: " : ""}${lastMsg.content}`
              : "Sin mensajes"

            return (
              <Link
                key={conv.id}
                href={`/inbox/${conv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {displayName[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm truncate">{displayName}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(conv.updated_at)}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{preview}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
