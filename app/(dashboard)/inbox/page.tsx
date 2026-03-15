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
    <div className="flex-1 overflow-auto p-6">
      <div className="flex flex-col gap-5 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-500 text-sm">Tus conversaciones de WhatsApp</p>
        </div>

        <InboxList
          initialConversations={(conversations ?? []) as any}
          tenantId={tenant.id}
        />
      </div>
    </div>
  )
}
