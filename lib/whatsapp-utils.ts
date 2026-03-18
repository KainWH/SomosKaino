import crypto from "crypto"

// ── Validación de firma del webhook de Meta ─────────────────────────────────
// Meta firma cada request con HMAC-SHA256 usando el APP_SECRET.
// Si la firma no coincide, el request no viene de Meta → rechazar.
export function validateWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret || !signature) return false

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`

  // timingSafeEqual previene timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    )
  } catch {
    return false
  }
}

// ── Ventana de 24h de Meta ──────────────────────────────────────────────────
// Solo se pueden enviar mensajes libres dentro de las 24h del último mensaje
// del usuario. Fuera de esa ventana, solo templates aprobados.
export function isWithin24hWindow(lastUserMessageAt: string | null | undefined): boolean {
  if (!lastUserMessageAt) return true // sin datos → permitir, Meta dará error si aplica
  const windowMs = 24 * 60 * 60 * 1000
  return Date.now() - new Date(lastUserMessageAt).getTime() < windowMs
}
