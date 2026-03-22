-- ════════════════════════════════════════════════════════════
--  Migración 010: Añadir ubicación de tienda a tenants
--  El formulario de registro captura la dirección de la tienda.
--  El agente usa estos datos al compartir la ubicación.
-- ════════════════════════════════════════════════════════════

-- 1. Agregar columnas de ubicación (nullable para no romper tenants existentes)
alter table tenants add column if not exists store_address  text;
alter table tenants add column if not exists store_latitude  numeric(10, 7);
alter table tenants add column if not exists store_longitude numeric(10, 7);

-- 2. Actualizar la función trigger para capturar store_address del metadata
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  insert into tenants (owner_id, name, company, store_address)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data->>'company'), ''),
    nullif(trim(new.raw_user_meta_data->>'store_address'), '')
  )
  returning id into new_tenant_id;

  insert into whatsapp_configs (tenant_id) values (new_tenant_id);
  insert into ai_configs (tenant_id) values (new_tenant_id);

  return new;
end;
$$;
