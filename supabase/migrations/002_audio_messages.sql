-- ════════════════════════════════════════════════════════════
--  Migración 002: soporte para notas de voz
--  - message_type: 'text' | 'audio' (default 'text')
--  - media_id: ID del media en WhatsApp, para descargarlo como proxy
-- ════════════════════════════════════════════════════════════

alter table messages
  add column if not exists message_type text not null default 'text',
  add column if not exists media_id text;
