// Funciones para interactuar con la API oficial de WhatsApp Business de Meta

const WHATSAPP_API_URL = "https://graph.facebook.com/v20.0"

// Envía un mensaje de texto a un número de WhatsApp
export async function sendWhatsAppMessage({
  to,
  message,
  phoneNumberId,
  accessToken,
}: {
  to: string          // Número destino: "5215512345678"
  message: string     // Texto a enviar
  phoneNumberId: string  // ID del número de Meta
  accessToken: string    // Token de acceso de Meta
}) {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Error de WhatsApp API: ${JSON.stringify(error)}`)
  }

  return response.json()
}

// Descarga un archivo de media de WhatsApp (audio, imagen, etc.)
// Paso 1: obtener la URL real del media usando su ID
// Paso 2: descargar el archivo con el token de acceso
export async function downloadMedia({
  mediaId,
  accessToken,
}: {
  mediaId: string
  accessToken: string
}): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    // Paso 1: obtener URL y mime_type
    const metaRes = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!metaRes.ok) return null
    const { url, mime_type } = await metaRes.json()

    // Paso 2: descargar el archivo
    const fileRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!fileRes.ok) return null

    const buffer = Buffer.from(await fileRes.arrayBuffer())
    return { buffer, mimeType: mime_type ?? "audio/ogg" }
  } catch {
    return null
  }
}

// Sube un archivo de media a WhatsApp y devuelve su media_id
export async function uploadMedia({
  buffer,
  mimeType,
  filename,
  phoneNumberId,
  accessToken,
}: {
  buffer: Buffer
  mimeType: string
  filename: string
  phoneNumberId: string
  accessToken: string
}): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append("messaging_product", "whatsapp")
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
    formData.append("file", new Blob([arrayBuffer], { type: mimeType }), filename)

    const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/media`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body:    formData,
    })
    if (!res.ok) {
      const err = await res.json()
      console.error("❌ Error subiendo media:", JSON.stringify(err))
      return null
    }
    const { id } = await res.json()
    return id as string
  } catch {
    return null
  }
}

// Envía una imagen o audio a WhatsApp usando un media_id ya subido
export async function sendWhatsAppMedia({
  to,
  mediaId,
  type,
  phoneNumberId,
  accessToken,
}: {
  to: string
  mediaId: string
  type: "image" | "audio" | "document"
  phoneNumberId: string
  accessToken: string
}) {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type,
        [type]: { id: mediaId },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Error de WhatsApp API: ${JSON.stringify(error)}`)
  }

  return response.json()
}

// Marca un mensaje como leído (palomitas azules)
export async function markAsRead({
  messageId,
  phoneNumberId,
  accessToken,
}: {
  messageId: string
  phoneNumberId: string
  accessToken: string
}) {
  await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  })
}
