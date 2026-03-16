import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InboxList from "./inbox-list"

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) redirect("/login")

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, status, ai_paused, updated_at, contacts ( id, name, phone ), messages ( content, direction, sent_by_ai, created_at )")
    .eq("tenant_id", tenant.id)
    .order("updated_at", { ascending: false })

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Panel izquierdo — lista de chats ── */}
      <div className="w-80 shrink-0 border-r border-slate-800/60 flex flex-col bg-slate-900/50 overflow-hidden">
        <InboxList
          initialConversations={(conversations ?? []) as any}
          tenantId={tenant.id}
        />
      </div>

      {/* ── Panel central + derecho (children) ── */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  )
}
