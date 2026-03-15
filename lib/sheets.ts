// Obtiene los datos de Google Sheets como CSV y los convierte a texto legible para la IA
// El sheet debe estar en modo público: "Cualquiera con el enlace puede ver"

const SHEET_ID  = "1lPNKPKn43Xoc3uRQTPkn0-2PIMQH4UXp3OOIHnPu-_k"
const SHEET_GID = "1022367056"
const CSV_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`

// Cache en memoria — se renueva cada 5 minutos para no pedir el sheet en cada mensaje
let cache: { text: string; fetchedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

// Convierte CSV a un formato de tabla legible para la IA
function csvToText(csv: string): string {
  const lines = csv.trim().split("\n").filter(Boolean)
  if (lines.length === 0) return ""

  return lines
    .map((line) => {
      // Divide por comas respetando campos entre comillas
      const cells = line.match(/(".*?"|[^",]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) ?? []
      return cells.map((c) => c.replace(/^"|"$/g, "").trim()).join(" | ")
    })
    .join("\n")
}

export async function getPropertyData(): Promise<string> {
  const now = Date.now()

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.text
  }

  try {
    const res = await fetch(CSV_URL, { next: { revalidate: 0 } })
    if (!res.ok) {
      console.error(`❌ No se pudo obtener el sheet: ${res.status}`)
      return cache?.text ?? ""
    }

    const csv  = await res.text()
    const text = csvToText(csv)
    cache = { text, fetchedAt: now }
    console.log("✅ Sheet de propiedades actualizado")
    return text
  } catch (err) {
    console.error("❌ Error al obtener el sheet:", err)
    return cache?.text ?? ""
  }
}
