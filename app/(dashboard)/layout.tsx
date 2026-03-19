import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Sidebar    from "@/components/Sidebar"
import Header     from "@/components/Header"
import MobileNav  from "@/components/MobileNav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tenant } = await supabase
    .from("tenants").select("name").eq("owner_id", user.id).single()

  const tenantName = tenant?.name ?? "Mi cuenta"
  const email      = user.email ?? ""

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#060e20" }}>
      <Sidebar tenantName={tenantName} email={email} />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Header name={tenantName} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <MobileNav tenantName={tenantName} email={email} />
    </div>
  )
}
