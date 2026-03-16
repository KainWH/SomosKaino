// Funciones para el Catálogo de WhatsApp Business (Meta Commerce Manager)
// Documentación: https://developers.facebook.com/docs/commerce-platform/catalog

const GRAPH_API = "https://graph.facebook.com/v20.0"

export type WACatalogProduct = {
  id:           string
  retailer_id?: string
  name:         string
  description?: string
  price?:       number    // en centavos (ej: 1000 = $10.00)
  currency?:    string    // "USD", "MXN", "DOP", etc.
  image_url?:   string
}

// Cache en memoria — se renueva cada 5 minutos
const catalogCache = new Map<string, { products: WACatalogProduct[]; fetchedAt: number }>()
const CACHE_TTL = 5 * 60 * 1000

export async function fetchCatalogProducts(
  catalogId:   string,
  accessToken: string
): Promise<{ products: WACatalogProduct[]; error?: string }> {
  const now    = Date.now()
  const cached = catalogCache.get(catalogId)

  if (cached && now - cached.fetchedAt < CACHE_TTL) {
    return { products: cached.products }
  }

  try {
    const fields = "id,retailer_id,name,description,price,currency,image_url"
    const res = await fetch(
      `${GRAPH_API}/${catalogId}/products?fields=${fields}&limit=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) {
      const err = await res.json()
      return {
        products: cached?.products ?? [],
        error:    err?.error?.message ?? `Error ${res.status} al acceder al catálogo`,
      }
    }

    const json     = await res.json()
    const products = (json.data ?? []) as WACatalogProduct[]
    catalogCache.set(catalogId, { products, fetchedAt: now })
    return { products }
  } catch {
    return { products: cached?.products ?? [], error: "Error de conexión con Meta API" }
  }
}

// Convierte los productos a texto para incluirlo en el prompt de la IA
export function catalogProductsToText(products: WACatalogProduct[]): string {
  if (!products.length) return ""

  const lines = products.map(p => {
    const price = p.price != null
      ? ` — $${(p.price / 100).toFixed(2)} ${p.currency ?? ""}`.trim()
      : ""
    const desc = p.description ? ` — ${p.description}` : ""
    return `• ${p.name}${desc}${price}`
  })

  return lines.join("\n")
}
