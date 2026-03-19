import {
  MessageCircle,
  BrainCircuit,
  BarChart2,
  Bell,
  Users,
  ArrowRight,
  Twitter,
  Instagram,
  Linkedin,
  Zap,
} from "lucide-react"
import KainoLogo from "@/components/KainoLogo"

// ── NAVBAR ─────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b border-[#1f2b49]" style={{ background: "rgba(6,14,32,0.85)" }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5">
          <KainoLogo size={32} className="rounded-xl" />
          <span className="text-[15px] font-bold text-[#dee5ff] tracking-tight">SomosKaino</span>
        </a>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#funcionalidades" className="text-sm text-[#a3aac4] hover:text-[#dee5ff] transition-colors">Funcionalidades</a>
          <a href="#proceso"         className="text-sm text-[#a3aac4] hover:text-[#dee5ff] transition-colors">Proceso</a>
          <a href="#contacto"        className="text-sm text-[#a3aac4] hover:text-[#dee5ff] transition-colors">Contacto</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm text-[#a3aac4] hover:text-[#dee5ff] transition-colors px-3 py-1.5">
            Iniciar sesión
          </a>
          <a
            href="/register"
            className="text-sm bg-[#FF6D00] hover:bg-[#e86200] text-white px-4 py-2 rounded-xl transition-colors font-semibold shadow-lg shadow-orange-900/20"
          >
            Empezar ahora
          </a>
        </div>
      </div>
    </header>
  )
}

// ── HERO ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-40 pb-28 px-6">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8">

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6D00] bg-[#FF6D00]/10 border border-[#FF6D00]/25 px-3 py-1 rounded-full">
          <Zap size={11} className="text-[#FF6D00]" />
          Inteligencia Artificial para WhatsApp
        </span>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-[#dee5ff] leading-[1.1] tracking-tight max-w-3xl">
          Vende más con{" "}
          <span className="text-[#FF6D00]">cada conversación</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-[#a3aac4] max-w-xl leading-relaxed">
          SomosKaino convierte tus chats de WhatsApp en ventas cerradas.
          Tu agente de IA responde, califica y agenda — sin que tengas que intervenir.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-[#FF6D00] hover:bg-[#e86200] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-900/20 hover:scale-105 active:scale-100"
          >
            Empezar ahora <ArrowRight size={15} />
          </a>
          <a
            href="#proceso"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#a3aac4] border border-[#1f2b49] px-6 py-3 rounded-xl hover:bg-[#0a1628] hover:text-[#dee5ff] transition-colors"
          >
            Ver demostración
          </a>
        </div>

        {/* Social proof */}
        <p className="text-xs text-[#3a4460] pt-2">
          Sin tarjeta de crédito · Configuración en minutos
        </p>
      </div>
    </section>
  )
}

// ── FEATURES ───────────────────────────────────────────────────────────────
const features = [
  {
    icon:  MessageCircle,
    title: "Respuestas automáticas 24/7",
    desc:  "El agente responde al instante, cualquier día, a cualquier hora. Sin demoras, sin leads perdidos.",
    color: "text-[#FF6D00]",
    bg:    "bg-[#FF6D00]/10 border-[#FF6D00]/20",
  },
  {
    icon:  BrainCircuit,
    title: "IA entrenada con tu negocio",
    desc:  "Carga tu catálogo, precios y documentos. El agente habla como si fuera tú.",
    color: "text-[#40C4FF]",
    bg:    "bg-[#40C4FF]/10 border-[#40C4FF]/20",
  },
  {
    icon:  Users,
    title: "Calificación de leads",
    desc:  "Detecta intención de compra, captura datos clave y prioriza automáticamente a los mejores prospectos.",
    color: "text-[#b36dff]",
    bg:    "bg-[#b36dff]/10 border-[#b36dff]/20",
  },
  {
    icon:  Bell,
    title: "Handover inteligente",
    desc:  "Cuando un cliente está listo para cerrar, el agente te avisa y cede la conversación en el momento justo.",
    color: "text-[#FF6D00]",
    bg:    "bg-[#FF6D00]/10 border-[#FF6D00]/20",
  },
  {
    icon:  BarChart2,
    title: "Métricas en tiempo real",
    desc:  "Visualiza conversaciones, tasa de respuesta y leads activos desde un dashboard limpio y simple.",
    color: "text-[#40C4FF]",
    bg:    "bg-[#40C4FF]/10 border-[#40C4FF]/20",
  },
  {
    icon:  Zap,
    title: "Activación inmediata",
    desc:  "Conecta tu número de WhatsApp Business, configura el agente y empieza a vender en minutos.",
    color: "text-[#b36dff]",
    bg:    "bg-[#b36dff]/10 border-[#b36dff]/20",
  },
]

function Features() {
  return (
    <section id="funcionalidades" className="py-24 px-6" style={{ background: "#091328" }}>
      <div className="max-w-6xl mx-auto flex flex-col gap-14">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <p className="text-xs font-semibold text-[#FF6D00] uppercase tracking-widest">Funcionalidades</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#dee5ff] leading-tight">
            Todo lo que necesitas para cerrar más ventas
          </h2>
          <p className="text-[#a3aac4] text-base">
            Un CRM potenciado por IA, diseñado específicamente para negocios que venden por WhatsApp.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="border border-[#1f2b49] rounded-2xl p-6 flex flex-col gap-4 hover:border-[#2a3a5c] transition-colors"
              style={{ background: "#0a1628" }}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${bg}`}>
                <Icon size={18} className={color} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-[#dee5ff]">{title}</h3>
                <p className="text-sm text-[#a3aac4] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── PROCESS ────────────────────────────────────────────────────────────────
const steps = [
  {
    number: "01",
    title:  "Llega el mensaje",
    desc:   "Un lead te escribe por WhatsApp. El agente lo recibe al instante.",
  },
  {
    number: "02",
    title:  "La IA responde",
    desc:   "Consulta tu catálogo y base de conocimiento para dar una respuesta precisa y personalizada.",
  },
  {
    number: "03",
    title:  "Califica al lead",
    desc:   "Detecta interés real, captura nombre, producto y presupuesto. Sin formularios, en conversación natural.",
  },
  {
    number: "04",
    title:  "Te avisa para cerrar",
    desc:   "Cuando el cliente confirma el pedido, recibes una alerta y el control vuelve a tus manos.",
  },
]

function Process() {
  return (
    <section id="proceso" className="py-24 px-6" style={{ background: "#060e20" }}>
      <div className="max-w-6xl mx-auto flex flex-col gap-14">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <p className="text-xs font-semibold text-[#40C4FF] uppercase tracking-widest">Proceso</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#dee5ff] leading-tight">
            De mensaje a venta, en automático
          </h2>
          <p className="text-[#a3aac4] text-base">
            Así funciona SomosKaino en cada conversación.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
          {steps.map((step, i) => (
            <div key={step.number} className="flex flex-col md:flex-row">
              <div className="flex flex-col gap-4 flex-1 px-6 py-4">
                <span className="text-4xl font-black leading-none select-none" style={{ color: "rgba(255,109,0,0.18)" }}>
                  {step.number}
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-bold text-[#dee5ff]">{step.title}</h3>
                  <p className="text-sm text-[#a3aac4] leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex items-center px-1 pt-10">
                  <ArrowRight size={16} className="text-[#1f2b49] shrink-0" />
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

// ── CTA BANNER ─────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <section className="py-20 px-6" style={{ background: "#091328" }}>
      <div className="max-w-2xl mx-auto text-center flex flex-col gap-6">
        <h2 className="text-3xl md:text-4xl font-bold text-[#dee5ff] leading-tight">
          Tu negocio merece un{" "}
          <span className="text-[#FF6D00]">vendedor que no descansa</span>
        </h2>
        <p className="text-[#a3aac4] text-base">
          Activa SomosKaino hoy y empieza a convertir cada conversación en una oportunidad real.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-[#FF6D00] hover:bg-[#e86200] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-900/20 hover:scale-105 active:scale-100"
          >
            Empezar ahora <ArrowRight size={15} />
          </a>
          <a
            href="/login"
            className="text-sm text-[#a3aac4] hover:text-[#dee5ff] transition-colors px-4 py-3"
          >
            Ya tengo una cuenta →
          </a>
        </div>
      </div>
    </section>
  )
}

// ── FOOTER ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contacto" className="border-t border-[#1f2b49] px-6 pt-14 pb-8" style={{ background: "#060e20" }}>
      <div className="max-w-6xl mx-auto flex flex-col gap-10">

        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <a href="/" className="flex items-center gap-2.5">
              <KainoLogo size={32} className="rounded-xl" />
              <span className="text-[15px] font-bold text-[#dee5ff] tracking-tight">SomosKaino</span>
            </a>
            <p className="text-sm text-[#a3aac4] leading-relaxed">
              CRM con IA para WhatsApp. Convierte conversaciones en clientes.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a href="#" aria-label="Twitter"   className="text-[#3a4460] hover:text-[#dee5ff] transition-colors"><Twitter   size={16} /></a>
              <a href="#" aria-label="Instagram" className="text-[#3a4460] hover:text-[#dee5ff] transition-colors"><Instagram size={16} /></a>
              <a href="#" aria-label="LinkedIn"  className="text-[#3a4460] hover:text-[#dee5ff] transition-colors"><Linkedin  size={16} /></a>
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-[#a3aac4] uppercase tracking-widest">Producto</p>
            <div className="flex flex-col gap-2.5">
              <a href="#funcionalidades" className="text-sm text-[#3a4460] hover:text-[#dee5ff] transition-colors">Funcionalidades</a>
              <a href="#proceso"         className="text-sm text-[#3a4460] hover:text-[#dee5ff] transition-colors">Cómo funciona</a>
              <a href="/register"        className="text-sm text-[#3a4460] hover:text-[#dee5ff] transition-colors">Empezar ahora</a>
            </div>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-[#a3aac4] uppercase tracking-widest">Cuenta</p>
            <div className="flex flex-col gap-2.5">
              <a href="/login"     className="text-sm text-[#3a4460] hover:text-[#dee5ff] transition-colors">Iniciar sesión</a>
              <a href="/register"  className="text-sm text-[#3a4460] hover:text-[#dee5ff] transition-colors">Registrarse</a>
              <a href="/dashboard" className="text-sm text-[#3a4460] hover:text-[#dee5ff] transition-colors">Dashboard</a>
            </div>
          </div>

          {/* Col 4 */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-[#a3aac4] uppercase tracking-widest">Legal</p>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-sm text-[#3a4460] hover:text-[#dee5ff] transition-colors">Términos de uso</a>
              <a href="#" className="text-sm text-[#3a4460] hover:text-[#dee5ff] transition-colors">Privacidad</a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[#1f2b49] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#3a4460]">© {new Date().getFullYear()} SomosKaino. Todos los derechos reservados.</p>
          <p className="text-xs text-[#3a4460]">Hecho con IA · Powered by WhatsApp Business API</p>
        </div>
      </div>
    </footer>
  )
}

// ── PAGE ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: "#060e20" }}>
      <Navbar />
      <Hero />
      <Features />
      <Process />
      <CtaBanner />
      <Footer />
    </main>
  )
}
