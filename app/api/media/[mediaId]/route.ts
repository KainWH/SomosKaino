// Proxy para descargar audio de WhatsApp
// Las URLs de media de WhatsApp expiran, pero el media_id es permanente.
// Este endpoint descarga el audio fresco usando el token del tenant.

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const WHATSAPP_API_URL = "https://graph.facebook.com/v20.0"

export async function GET(
  _req: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  // Verificar que el usuario está autenticado
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  // Obtener el tenant del usuario
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  // Obtener el access_token de WhatsApp del tenant
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: config } = await service
    .from("whatsapp_configs")
    .select("access_token")
    .eq("tenant_id", tenant.id)
    .single()

  if (!config?.access_token) {
    return NextResponse.json({ error: "Sin configuración de WhatsApp" }, { status: 404 })
  }

  // Paso 1: obtener la URL firmada del media
  const metaRes = await fetch(`${WHATSAPP_API_URL}/${params.mediaId}`, {
    headers: { Authorization: `Bearer ${config.access_token}` },
  })
  if (!metaRes.ok) return NextResponse.json({ error: "Media no encontrado" }, { status: 404 })

  const { url, mime_type } = await metaRes.json()

  // Paso 2: descargar el archivo
  const fileRes = await fetch(url, {
    headers: { Authorization: `Bearer ${config.access_token}` },
  })
  if (!fileRes.ok) return NextResponse.json({ error: "Error al descargar" }, { status: 502 })

  const buffer = await fileRes.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":  mime_type ?? "audio/ogg",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
