import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react"
import Sparkline from "@/components/Sparkline"

type Props = {
  label:      string
  value:      string | number
  sublabel?:  string
  trend?:     { value: number; label: string }
  sparkline?: number[]
  icon:       LucideIcon
  color:      "orange" | "blue" | "purple" | "teal"
  href?:      string
}

const palette = {
  orange: { ring: "bg-[#FF6D00]/10 border-[#FF6D00]/20", icon: "text-[#FF6D00]",  value: "text-[#FF6D00]",  spark: "#FF6D00" },
  blue:   { ring: "bg-[#40C4FF]/10 border-[#40C4FF]/20", icon: "text-[#40C4FF]",  value: "text-[#40C4FF]",  spark: "#40C4FF" },
  purple: { ring: "bg-[#b36dff]/10 border-[#b36dff]/20", icon: "text-[#b36dff]",  value: "text-[#b36dff]",  spark: "#b36dff" },
  teal:   { ring: "bg-[#00e5cc]/10 border-[#00e5cc]/20", icon: "text-[#00e5cc]",  value: "text-[#00e5cc]",  spark: "#00e5cc" },
}

export default function MetricCard({ label, value, sublabel, trend, sparkline, icon: Icon, color, href }: Props) {
  const c    = palette[color]
  const isUp = trend && trend.value >= 0

  const card = (
    <div className="
      group relative rounded-2xl
      border border-[#1f2b49] p-5 flex flex-col gap-4
      hover:border-[#2a3a5c] hover:bg-[#0d1a35]
      hover:shadow-xl hover:shadow-[#060e20]/50
      hover:-translate-y-0.5 transition-all duration-200 cursor-pointer
    " style={{ background: "#0a1628" }}>
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl border ${c.ring} ${c.icon} flex items-center justify-center`}>
          <Icon size={18} strokeWidth={1.75} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
            isUp
              ? "bg-[#40C4FF]/10 text-[#40C4FF] border border-[#40C4FF]/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isUp ? "+" : ""}{trend.value}%
          </div>
        )}
      </div>

      {/* Valor */}
      <div>
        <p className={`text-3xl font-bold leading-none tracking-tight ${c.value}`}>{value}</p>
        <p className="text-xs text-[#a3aac4] mt-1.5 font-medium">{label}</p>
        {sublabel && <p className="text-[11px] text-[#3a4460] mt-0.5">{sublabel}</p>}
        {trend && <p className="text-[10px] text-[#3a4460] mt-1">{trend.label}</p>}
      </div>

      {/* Sparkline */}
      {sparkline && (
        <div className="mt-auto">
          <Sparkline data={sparkline} color={c.spark} height={28} width={100} />
        </div>
      )}
    </div>
  )

  if (href) return <a href={href}>{card}</a>
  return card
}
