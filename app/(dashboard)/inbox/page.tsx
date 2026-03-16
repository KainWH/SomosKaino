import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InboxList from "./inbox-list"

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
      ai_paused,
      updated_at,
      contacts ( id, name, phone ),
      messages ( content, direction, sent_by_ai, created_at )
    `)
    .eq("tenant_id", tenant.id)
    .order("updated_at", { ascending: false })

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="px-6 h-14 flex items-center border-b border-gray-100 bg-white shrink-0">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900">Inbox</h1>
          <p className="text-[11px] text-gray-400 leading-none mt-0.5">Conversaciones de WhatsApp</p>
        </div>
      </div>

      {/* Lista scrolleable */}
      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-2xl flex flex-col gap-4">
          <InboxList
            initialConversations={(conversations ?? []) as any}
            tenantId={tenant.id}
          />
        </div>
      </div>
    </div>
  )
}
