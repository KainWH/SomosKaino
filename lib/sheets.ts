// Obtiene los datos de Google Sheets como CSV y los convierte a texto legible para la IA
// El sheet debe estar en modo público: "Cualquiera con el enlace puede ver"

const SHEET_ID  = "1lPNKPKn43Xoc3uRQTPkn0-2PIMQH4UXp3OOIHnPu-_k"
const SHEET_GID = "1022367056"
const CSV_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`

export type SheetData = {
  text:     string                    // contexto para la IA (sin URLs reales)
  imageMap: Record<string, string>    // nombre_producto_lowercase → URL de imagen
}

// Cache en memoria — se renueva cada 5 minutos
let cache: (SheetData & { fetchedAt: number }) | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

// Parser de línea CSV que respeta campos entre comillas
function parseCSVLine(line: string): string[] {
  const cells: string[] = []
  let current  = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  cells.push(current.trim())
  return cells
}

// Convierte cualquier formato de URL de Google Drive a una URL de imagen directa
function normalizeImageUrl(url: string): string {
  if (!url) return url

  // Extrae el FILE_ID de cualquier formato de Drive:
  // /file/d/FILE_ID/view, /open?id=FILE_ID, /uc?id=FILE_ID, etc.
  let fileId: string | null = null

  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) fileId = fileMatch[1]

  if (!fileId) {
    const paramMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (paramMatch) fileId = paramMatch[1]
  }

  if (fileId) {
    // thumbnail es más confiable que uc?export=download para imágenes
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
  }

  return url
}

function parseSheet(csv: string): SheetData {
  const lines = csv.trim().split("\n").filter(Boolean)
  if (lines.length === 0) return { text: "", imageMap: {} }

  const headers   = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
  const imageIdx  = headers.findIndex(h => h.includes("imagen") || h.includes("image") || h.includes("foto") || h.includes("url"))
  const nameIdx   = headers.findIndex(h => h.includes("nombre") || h.includes("name") || h.includes("producto") || h.includes("modelo"))

  const imageMap: Record<string, string> = {}
  const textLines: string[] = []

  // Cabecera para la IA (reemplazamos imagen_url por "imagen")
  const displayHeaders = headers.map((h, i) =>
    i === imageIdx ? "imagen" : h
  )
  textLines.push(displayHeaders.join(" | "))

  for (const line of lines.slice(1)) {
    const cells = parseCSVLine(line)

    // Construir mapa de imagen
    const productName = nameIdx >= 0 ? cells[nameIdx]?.trim() : cells[0]?.trim()
    const rawUrl      = imageIdx >= 0 ? cells[imageIdx]?.trim() : ""
    if (productName && rawUrl) {
      imageMap[productName.toLowerCase()] = normalizeImageUrl(rawUrl)
    }

    // Texto para la IA: en lugar de la URL, mostrar "disponible" o ""
    const displayCells = cells.map((c, i) => {
      if (i === imageIdx) return rawUrl ? "disponible" : ""
      return c.replace(/^"|"$/g, "").trim()
    })
    textLines.push(displayCells.join(" | "))
  }

  return { text: textLines.join("\n"), imageMap }
}

export async function getPropertyData(): Promise<SheetData> {
  const now = Date.now()

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { text: cache.text, imageMap: cache.imageMap }
  }

  try {
    const res = await fetch(CSV_URL, { next: { revalidate: 0 } })
    if (!res.ok) {
      console.error(`❌ No se pudo obtener el sheet: ${res.status}`)
      return cache ? { text: cache.text, imageMap: cache.imageMap } : { text: "", imageMap: {} }
    }

    const csv  = await res.text()
    const data = parseSheet(csv)
    cache = { ...data, fetchedAt: now }
    console.log(`✅ Sheet actualizado — ${Object.keys(data.imageMap).length} productos con imagen:`, Object.keys(data.imageMap))
    return data
  } catch (err) {
    console.error("❌ Error al obtener el sheet:", err)
    return cache ? { text: cache.text, imageMap: cache.imageMap } : { text: "", imageMap: {} }
  }
}

// Normaliza un nombre: minúsculas, guiones/underscores → espacios
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim()
}

// Busca la URL de imagen de un producto por nombre (fuzzy match)
export function findImageUrl(productName: string, imageMap: Record<string, string>): string | null {
  if (!productName) return null
  const key = normalizeName(productName)
  console.log(`🔍 Buscando imagen: "${key}" en`, Object.keys(imageMap).map(normalizeName))

  for (const [k, url] of Object.entries(imageMap)) {
    const nk = normalizeName(k)

    // Coincidencia exacta o parcial (normalizada)
    if (nk === key || nk.includes(key) || key.includes(nk)) return url

    // Coincidencia por palabras clave individuales (ej: "a07" en "samsung galaxy a07 negro")
    const words = key.split(/\s+/).filter(w => w.length > 1)
    if (words.every(w => nk.includes(w))) return url
  }

  return null
}
