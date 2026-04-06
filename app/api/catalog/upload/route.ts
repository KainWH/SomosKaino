import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const BUCKET = "catalog-images"

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).single()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })

  // Validar tamaño (máx 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen no debe superar 5MB" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  // Validar magic bytes reales del archivo (no confiar en el MIME del cliente)
  // JPEG: FF D8 FF | PNG: 89 50 4E 47 | GIF: 47 49 46 | WEBP: 52 49 46 46 __ __ __ __ 57 45 42 50
  const magic = buffer.subarray(0, 12)
  const isJpeg = magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF
  const isPng  = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47
  const isGif  = magic[0] === 0x47 && magic[1] === 0x49 && magic[2] === 0x46
  const isWebp = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46
                 && magic[8] === 0x57 && magic[9] === 0x45 && magic[10] === 0x42 && magic[11] === 0x50

  if (!isJpeg && !isPng && !isGif && !isWebp) {
    return NextResponse.json({ error: "Solo se permiten imágenes JPEG, PNG, GIF o WEBP" }, { status: 400 })
  }

  const extMap: Record<string, string> = { jpeg: "jpg", png: "png", gif: "gif", webp: "webp" }
  const detectedType = isJpeg ? "jpeg" : isPng ? "png" : isGif ? "gif" : "webp"
  const ext      = extMap[detectedType]
  const mimeType = isJpeg ? "image/jpeg" : isPng ? "image/png" : isGif ? "image/gif" : "image/webp"

  const filename = `${Date.now()}.${ext}`
  const path     = `${tenant.id}/${filename}`

  // Usar service role para subir sin restricciones de RLS en storage
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await service.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert:      false,
    })

  if (error) return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 })

  const { data: { publicUrl } } = service.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
