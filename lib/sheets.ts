// Obtiene los datos de Google Sheets como JSON y los convierte a texto legible para la IA
// El sheet debe estar en modo público: "Cualquiera con el enlace puede ver"

function buildJsonUrl(sheetId: string, sheetGid: string) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${sheetGid}`
}

export type SheetData = {
  text:     string                    // contexto para la IA (sin URLs reales)
  imageMap: Record<string, string>    // nombre_producto_lowercase → URL de imagen
}

// Cache en memoria por tenant — se renueva cada 5 minutos
const cacheMap = new Map<string, SheetData & { fetchedAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

// Convierte cualquier formato de URL de Google Drive a una URL de imagen directa
function normalizeImageUrl(url: string): string {
  if (!url) return url

  let fileId: string | null = null

  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) fileId = fileMatch[1]

  if (!fileId) {
    const paramMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (paramMatch) fileId = paramMatch[1]
  }

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
  }

  return url
}

// Normaliza un nombre: minúsculas, guiones/underscores → espacios
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim()
}

function parseGvizJson(raw: string): SheetData {
  // El gviz JSON viene envuelto en: google.visualization.Query.setResponse({...});
  const match = raw.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)
  if (!match) {
    console.error("❌ No se pudo extraer JSON del gviz response")
    return { text: "", imageMap: {} }
  }

  let table: { cols: { label: string }[]; rows: { c: ({ v: string | null } | null)[] }[] }
  try {
    const parsed = JSON.parse(match[1])
    table = parsed.table
  } catch {
    console.error("❌ Error parseando JSON del sheet")
    return { text: "", imageMap: {} }
  }

  const cols = table.cols.map(c => c.label?.toLowerCase().trim() ?? "")

  // Encontrar columnas de nombre e imagen
  const nameIdx  = cols.findIndex(h => h.includes("nombre") || h.includes("name") || h.includes("producto") || h.includes("modelo"))
  const imageIdx = cols.findIndex(h => h.includes("imagen") || h.includes("image") || h.includes("foto") || h.includes("url"))

  console.log(`📋 Columnas (${cols.length}): nameIdx=${nameIdx} ("${cols[nameIdx]}"), imageIdx=${imageIdx} ("${cols[imageIdx]}")`)

  const imageMap: Record<string, string> = {}
  const textLines: string[] = []

  // Cabecera para la IA
  const displayCols = cols.map((h, i) => i === imageIdx ? "imagen" : h)
  textLines.push(displayCols.join(" | "))

  for (const row of table.rows) {
    const cells = row.c ?? []
    const getValue = (i: number) => cells[i]?.v?.toString().trim() ?? ""

    const productName = nameIdx >= 0 ? getValue(nameIdx) : getValue(0)
    const rawUrl      = imageIdx >= 0 ? getValue(imageIdx) : ""

    if (productName && rawUrl) {
      imageMap[productName.toLowerCase()] = normalizeImageUrl(rawUrl)
    }

    // Texto para la IA
    const displayRow = cols.map((_, i) => {
      if (i === imageIdx) return rawUrl ? "disponible" : ""
      return getValue(i)
    })
    textLines.push(displayRow.join(" | "))
  }

  return { text: textLines.join("\n"), imageMap }
}

export async function getPropertyData(sheetId?: string | null, sheetGid?: string | null): Promise<SheetData> {
  if (!sheetId || !sheetGid) return { text: "", imageMap: {} }
  const id  = sheetId
  const gid = sheetGid
  const cacheKey = `${id}:${gid}`
  const now = Date.now()

  const cached = cacheMap.get(cacheKey)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { text: cached.text, imageMap: cached.imageMap }
  }

  const jsonUrl = buildJsonUrl(id, gid)

  try {
    const res = await fetch(jsonUrl, { cache: "no-store" })
    if (!res.ok) {
      console.error(`❌ No se pudo obtener el sheet: ${res.status}`)
      return cached ?? { text: "", imageMap: {} }
    }

    const raw  = await res.text()
    const data = parseGvizJson(raw)
    cacheMap.set(cacheKey, { ...data, fetchedAt: now })
    console.log(`✅ Sheet actualizado (${id}) — ${Object.keys(data.imageMap).length} productos con imagen:`, Object.keys(data.imageMap))
    return data
  } catch (err) {
    console.error("❌ Error al obtener el sheet:", err)
    return cached ?? { text: "", imageMap: {} }
  }
}

// Busca la URL de imagen de un producto por nombre (fuzzy match)
export function findImageUrl(productName: string, imageMap: Record<string, string>): string | null {
  if (!productName) return null
  const key = normalizeName(productName)
  console.log(`🔍 Buscando imagen: "${key}" en`, Object.keys(imageMap).map(normalizeName))

  for (const [k, url] of Object.entries(imageMap)) {
    const nk = normalizeName(k)

    if (nk === key || nk.includes(key) || key.includes(nk)) return url

    const words = key.split(/\s+/).filter(w => w.length > 1)
    if (words.every(w => nk.includes(w))) return url
  }

  return null
}
