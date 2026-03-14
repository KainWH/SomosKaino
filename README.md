# 🤖 RentIA

**CRM con IA para WhatsApp** — Automatiza conversaciones, califica leads y agenda citas 24/7.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase)](https://supabase.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-API%20Oficial-25D366?logo=whatsapp)](https://business.whatsapp.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📋 Descripción

RentIA es un SaaS que permite a negocios automatizar sus ventas por WhatsApp usando inteligencia artificial. El agente de IA responde mensajes, califica prospectos y agenda citas automáticamente, permitiendo a los equipos comerciales enfocarse solo en cerrar ventas.

### ¿Para quién es?
- 🏢 Agencias de marketing
- 🏠 Inmobiliarias
- 🏥 Clínicas y consultorios
- 🚗 Concesionarios
- 📚 Instituciones educativas

---

## ✨ Características

- **💬 Inbox en tiempo real** — Todas las conversaciones de WhatsApp en un solo lugar
- **🤖 Agente de IA 24/7** — Responde, califica y agenda automáticamente
- **📊 CRM integrado** — Gestión de contactos, tags y estados
- **📅 Calendario inteligente** — Agenda citas sin intervención humana
- **📈 Embudos configurables** — Personaliza el flujo de ventas por etapas
- **🔗 Webhooks y API** — Integra con tus herramientas existentes
- **👥 Multi-tenant** — Cada cliente tiene su espacio aislado

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **IA** | Google Gemini / OpenAI |
| **Mensajería** | WhatsApp Business API (Meta Cloud API) |
| **Pagos** | Stripe |
| **Deploy** | Vercel |

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- API Key de [Google AI Studio](https://aistudio.google.com) o [OpenAI](https://platform.openai.com)
- Meta Business Account para WhatsApp API

### Configuración

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/KainWH/rentia.git
   cd rentia
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Configura variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=tu-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-key

   # IA (elige uno)
   GEMINI_API_KEY=tu-api-key
   # OPENAI_API_KEY=tu-api-key

   # WhatsApp
   WHATSAPP_TOKEN=tu-token
   WHATSAPP_PHONE_ID=tu-phone-id
   WHATSAPP_VERIFY_TOKEN=tu-verify-token

   # Stripe
   STRIPE_SECRET_KEY=tu-secret-key
   STRIPE_WEBHOOK_SECRET=tu-webhook-secret
   ```

4. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del Proyecto

```
rentia/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Panel principal
│   ├── api/               # API Routes
│   └── layout.tsx         # Layout principal
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/                   # Utilidades y configuraciones
│   ├── supabase/         # Cliente de Supabase
│   ├── ai/               # Configuración de IA
│   └── whatsapp/         # Helpers de WhatsApp API
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── public/               # Assets estáticos
```

---

## 🗺️ Roadmap

- [x] Estructura inicial del proyecto
- [ ] Sistema de autenticación
- [ ] Dashboard básico multi-tenant
- [ ] Integración WhatsApp API
- [ ] Inbox de conversaciones
- [ ] Agente de IA configurable
- [ ] Sistema de embudos
- [ ] Calendario y agendamiento
- [ ] Integración con Stripe
- [ ] Landing page pública

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 📞 Contacto

Desarrollado con ❤️ en República Dominicana

---

<p align="center">
  <b>RentIA</b> — Convierte conversaciones en clientes
</p>
