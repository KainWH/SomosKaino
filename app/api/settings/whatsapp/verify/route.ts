// GET /api/settings/whatsapp/verify
// Verifica las credenciales de WhatsApp llamando a la API de Meta.
// Devuelve { ok: true, displayPhoneNumber, verifiedName } o { ok: false, error }

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) return NextResponse.json({ ok: false, error: "Tenant no encontrado" }, { status: 404 })

  // Leer credenciales directamente desde DB (server-side, seguro)
  const { data: config } = await supabase
    .from("whatsapp_configs")
    .select("phone_number_id, access_token")
    .eq("tenant_id", tenant.id)
    .single()

  if (!config?.phone_number_id || !config?.access_token) {
    return NextResponse.json({ ok: false, error: "Credenciales no configuradas" })
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${config.phone_number_id}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,name_status`,
      {
        headers: { Authorization: `Bearer ${config.access_token}` },
        cache: "no-store",
      }
    )

    const data = await res.json()

    if (!res.ok || data.error) {
      const msg = data.error?.message ?? "Credenciales inválidas"
      return NextResponse.json({ ok: false, error: msg })
    }

    return NextResponse.json({
      ok:                     true,
      phoneNumberId:          config.phone_number_id,
      displayPhoneNumber:     data.display_phone_number,
      verifiedName:           data.verified_name,
      qualityRating:          data.quality_rating,
      codeVerificationStatus: data.code_verification_status ?? null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: `Error de red: ${msg}` })
  }
}
