-- ════════════════════════════════════════════════════════════
--  Migración 004: Base de conocimiento del agente de IA
--
--  Nuevas fuentes de conocimiento para el agente:
--  1. knowledge_documents — documentos de texto subidos manualmente
--  2. catalog_id en whatsapp_configs — catálogo de Meta Business
--     (Google Sheets ya existe en catalog_configs)
-- ════════════════════════════════════════════════════════════

-- ── Documentos de conocimiento (FAQ, precios, políticas, etc.) ──
create table knowledge_documents (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,        -- Nombre del documento (ej: "Lista de precios")
  content     text not null,        -- Contenido en texto plano
  enabled     boolean default true, -- Si el agente lo usa o no
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index knowledge_documents_tenant_id_idx on knowledge_documents(tenant_id);

alter table knowledge_documents enable row level security;

create policy "Tenant owners can manage knowledge documents"
  on knowledge_documents for all
  using (
    tenant_id in (select id from tenants where owner_id = auth.uid())
  );

create trigger set_updated_at_knowledge_documents
  before update on knowledge_documents
  for each row execute procedure update_updated_at();


-- ── catalog_id para el catálogo de WhatsApp Business (Meta) ──
alter table whatsapp_configs
  add column if not exists catalog_id text;

-- ── sheets_enabled en catalog_configs para poder activar/desactivar ──
alter table catalog_configs
  add column if not exists enabled boolean default true;
