/**
 * KainoLogo — Inline SVG del ícono de SomosKaino.
 *
 * Props:
 *  size      — lado del cuadrado en px (default 32)
 *  rounded   — incluye el fondo oscuro con esquinas redondeadas (default true)
 *  className — clases extra para el svg raíz
 */
export default function KainoLogo({
  size = 32,
  rounded = true,
  className = "",
}: {
  size?: number
  rounded?: boolean
  className?: string
}) {
  const r = rounded ? Math.round(size * 0.22) : 0        // radio ~22 % del tamaño

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SomosKaino logo"
    >
      <defs>
        <linearGradient id="kg" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#40C4FF" />
          <stop offset="100%" stopColor="#80D8FF" />
        </linearGradient>
      </defs>

      {/* Fondo Midnight Ember */}
      <rect width="512" height="512" rx={rounded ? r * 512 / size : 0} fill="#060e20" />

      {/* Barra vertical — naranja */}
      <rect x="156" y="116" width="56" height="280" rx="28" fill="#FF6D00" />

      {/* Flecha — degradado azul */}
      <polygon
        points="212,256 380,116 380,172 252,256 380,340 380,396 212,256"
        fill="url(#kg)"
      />
    </svg>
  )
}
