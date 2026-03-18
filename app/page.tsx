import {
  Zap,
  MessageCircle,
  BrainCircuit,
  BarChart2,
  Bell,
  Users,
  ArrowRight,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react"

// ── NAVBAR ─────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md shadow-green-900/30">
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">SomosKaino</span>
        </a>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#funcionalidades" className="text-sm text-gray-400 hover:text-white transition-colors">Funcionalidades</a>
          <a href="#proceso"         className="text-sm text-gray-400 hover:text-white transition-colors">Proceso</a>
          <a href="#contacto"        className="text-sm text-gray-400 hover:text-white transition-colors">Contacto</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a href="/login"    className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
            Iniciar sesión
          </a>
          <a
            href="/register"
            className="text-sm bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors font-medium shadow-sm shadow-green-900/30"
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
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
          <Zap size={11} className="text-green-400" />
          Inteligencia Artificial para WhatsApp
        </span>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight max-w-3xl">
          Vende más con{" "}
          <span className="text-green-400">cada conversación</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed">
          SomosKaino convierte tus chats de WhatsApp en ventas cerradas.
          Tu agente de IA responde, califica y agenda — sin que tengas que intervenir.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-green-600 transition-colors shadow-md shadow-green-900/30"
          >
            Empezar ahora <ArrowRight size={15} />
          </a>
          <a
            href="#proceso"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 border border-white/10 px-6 py-3 rounded-xl hover:bg-white/5 transition-colors"
          >
            Ver demostración
          </a>
        </div>

        {/* Social proof */}
        <p className="text-xs text-gray-500 pt-2">
          Sin tarjeta de crédito · Configuración en minutos
        </p>
      </div>
    </section>
  )
}

// ── FEATURES ───────────────────────────────────────────────────────────────
const features = [
  {
    icon: MessageCircle,
    title: "Respuestas automáticas 24/7",
    desc:  "El agente responde al instante, cualquier día, a cualquier hora. Sin demoras, sin leads perdidos.",
  },
  {
    icon: BrainCircuit,
    title: "IA entrenada con tu negocio",
    desc:  "Carga tu catálogo, precios y documentos. El agente habla como si fuera tú.",
  },
  {
    icon: Users,
    title: "Calificación de leads",
    desc:  "Detecta intención de compra, captura datos clave y prioriza automáticamente a los mejores prospectos.",
  },
  {
    icon: Bell,
    title: "Handover inteligente",
    desc:  "Cuando un cliente está listo para cerrar, el agente te avisa y cede la conversación en el momento justo.",
  },
  {
    icon: BarChart2,
    title: "Métricas en tiempo real",
    desc:  "Visualiza conversaciones, tasa de respuesta y leads activos desde un dashboard limpio y simple.",
  },
  {
    icon: Zap,
    title: "Activación inmediata",
    desc:  "Conecta tu número de WhatsApp Business, configura el agente y empieza a vender en minutos.",
  },
]

function Features() {
  return (
    <section id="funcionalidades" className="py-24 px-6 bg-slate-900">
      <div className="max-w-6xl mx-auto flex flex-col gap-14">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-widest">Funcionalidades</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Todo lo que necesitas para cerrar más ventas
          </h2>
          <p className="text-gray-400 text-base">
            Un CRM potenciado por IA, diseñado específicamente para negocios que venden por WhatsApp.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:bg-slate-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Icon size={18} className="text-green-400" strokeWidth={1.75} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
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
    <section id="proceso" className="py-24 px-6 bg-slate-950">
      <div className="max-w-6xl mx-auto flex flex-col gap-14">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-widest">Proceso</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            De mensaje a venta, en automático
          </h2>
          <p className="text-gray-400 text-base">
            Así funciona SomosKaino en cada conversación.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
          {steps.map((step, i) => (
            <div key={step.number} className="flex flex-col md:flex-row">
              <div className="flex flex-col gap-4 flex-1 px-6 py-4 relative">
                {/* Number */}
                <span className="text-4xl font-black text-green-500/20 leading-none select-none">
                  {step.number}
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {/* Connector — solo entre steps */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex items-center px-1 pt-10">
                  <ArrowRight size={16} className="text-white/10 shrink-0" />
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
    <section className="py-20 px-6 bg-gray-950">
      <div className="max-w-2xl mx-auto text-center flex flex-col gap-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
          Tu negocio merece un{" "}
          <span className="text-green-400">vendedor que no descansa</span>
        </h2>
        <p className="text-gray-400 text-base">
          Activa SomosKaino hoy y empieza a convertir cada conversación en una oportunidad real.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-green-400 transition-colors shadow-lg shadow-green-900/30"
          >
            Empezar ahora <ArrowRight size={15} />
          </a>
          <a
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-3"
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
    <footer id="contacto" className="bg-gray-950 border-t border-white/5 px-6 pt-14 pb-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">

        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md shadow-green-900/30">
                <Zap size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[15px] font-bold text-white tracking-tight">SomosKaino</span>
            </a>
            <p className="text-sm text-gray-500 leading-relaxed">
              CRM con IA para WhatsApp. Convierte conversaciones en clientes.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3 pt-1">
              <a href="#" aria-label="Twitter"   className="text-gray-600 hover:text-white transition-colors"><Twitter   size={16} /></a>
              <a href="#" aria-label="Instagram" className="text-gray-600 hover:text-white transition-colors"><Instagram size={16} /></a>
              <a href="#" aria-label="LinkedIn"  className="text-gray-600 hover:text-white transition-colors"><Linkedin  size={16} /></a>
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Producto</p>
            <div className="flex flex-col gap-2.5">
              <a href="#funcionalidades" className="text-sm text-gray-500 hover:text-white transition-colors">Funcionalidades</a>
              <a href="#proceso"         className="text-sm text-gray-500 hover:text-white transition-colors">Cómo funciona</a>
              <a href="/register"        className="text-sm text-gray-500 hover:text-white transition-colors">Empezar ahora</a>
            </div>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Cuenta</p>
            <div className="flex flex-col gap-2.5">
              <a href="/login"    className="text-sm text-gray-500 hover:text-white transition-colors">Iniciar sesión</a>
              <a href="/register" className="text-sm text-gray-500 hover:text-white transition-colors">Registrarse</a>
              <a href="/dashboard" className="text-sm text-gray-500 hover:text-white transition-colors">Dashboard</a>
            </div>
          </div>

          {/* Col 4 */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Legal</p>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Términos de uso</a>
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Privacidad</a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} SomosKaino. Todos los derechos reservados.</p>
          <p className="text-xs text-gray-700">Hecho con IA · Powered by WhatsApp Business API</p>
        </div>
      </div>
    </footer>
  )
}

// ── PAGE ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      <Hero />
      <Features />
      <Process />
      <CtaBanner />
      <Footer />
    </main>
  )
}
