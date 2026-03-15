import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Extrae sheet_id y sheet_gid de una URL de Google Sheets
function parseSheetUrl(url: string): { sheetId: string | null; sheetGid: string } {
  const idMatch  = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  const gidMatch = url.match(/[#&?]gid=(\d+)/)
  return {
    sheetId:  idMatch  ? idMatch[1]  : null,
    sheetGid: gidMatch ? gidMatch[1] : "0",
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { sheet_url } = await request.json()
  const { sheetId, sheetGid } = parseSheetUrl(sheet_url ?? "")

  if (!sheetId) {
    return NextResponse.json({ error: "URL de Google Sheets inválida" }, { status: 400 })
  }

  const { error } = await supabase
    .from("catalog_configs")
    .upsert({
      tenant_id: tenant.id,
      sheet_url,
      sheet_id:  sheetId,
      sheet_gid: sheetGid,
    }, { onConflict: "tenant_id" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const { data } = await supabase
    .from("catalog_configs")
    .select("sheet_url, sheet_id, sheet_gid")
    .eq("tenant_id", tenant.id)
    .single()

  return NextResponse.json(data ?? {})
}
