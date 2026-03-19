// Tipos TypeScript de SomosKaino
// Definen la "forma" de los datos que usaremos en toda la app
// Deben coincidir exactamente con las columnas de Supabase

// ── TENANT ──
// Un tenant = una empresa/agente que usa SomosKaino (multi-tenant SaaS)
export type Tenant = {
  id: string
  owner_id: string  // ID del usuario de Supabase Auth
  name: string
  created_at: string
}

// ── CONFIGURACIÓN DE WHATSAPP ──
// Separado de Tenant para mantener el código limpio
export type WhatsappConfig = {
  id: string
  tenant_id: string
  phone_number_id: string | null   // ID del número en Meta
  access_token?: string | null     // Token de Meta (secreto) — nunca enviado al cliente
  phone_display: string | null     // "+52 55 1234 5678" para mostrar
  is_configured: boolean
  created_at: string
  updated_at: string
}

// ── CONFIGURACIÓN DE IA ──
export type AiConfig = {
  id: string
  tenant_id: string
  enabled: boolean
  system_prompt: string
  model: string                    // "gemini-1.5-flash", "gemini-1.5-pro", etc.
  created_at: string
  updated_at: string
}

// ── CONTACTO / LEAD ──
export type Contact = {
  id: string
  tenant_id: string
  phone: string           // "+5215512345678" (formato E.164)
  name: string | null
  notes: string | null
  created_at: string
  last_message_at: string | null
}

// ── CONVERSACIÓN ──
export type Conversation = {
  id: string
  tenant_id: string
  contact_id: string
  status: "open" | "closed" | "archived"
  created_at: string
  updated_at: string
}

// ── MENSAJE ──
export type Message = {
  id: string
  conversation_id: string
  content: string
  direction: "inbound" | "outbound"   // inbound = recibido, outbound = enviado
  sent_by_ai: boolean
  whatsapp_message_id: string | null  // ID que devuelve Meta
  created_at: string
}

// ── TIPOS COMPUESTOS (para queries con JOIN) ──
// Cuando queremos una conversación con su contacto incluido
export type ConversationWithContact = Conversation & {
  contacts: Contact
}

// Cuando queremos un mensaje con el contexto de su conversación
export type MessageWithConversation = Message & {
  conversations: Conversation & {
    contacts: Contact
  }
}

// ── PRODUCTO DEL CATÁLOGO NATIVO ──
export type CatalogProduct = {
  id:          string
  tenant_id:   string
  name:        string
  description: string | null
  price:       number | null
  currency:    string
  image_url:   string | null
  category:    string | null
  enabled:     boolean
  created_at:  string
  updated_at:  string
}

// ── DOCUMENTO DE CONOCIMIENTO ──
// Texto libre que el agente usa como fuente de conocimiento (FAQ, precios, políticas, etc.)
export type KnowledgeDocument = {
  id:         string
  tenant_id:  string
  name:       string    // "Lista de precios", "Políticas de envío", etc.
  content:    string    // Contenido en texto plano
  enabled:    boolean
  created_at: string
  updated_at: string
}
