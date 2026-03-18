-- ════════════════════════════════════════════════════════════
--  Migración 008: bucket para media de chat (imágenes y audio outbound)
-- ════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

create policy "Auth users can upload chat media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-media');

create policy "Auth users can update chat media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'chat-media');

create policy "Auth users can delete chat media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'chat-media');

create policy "Public can view chat media"
  on storage.objects for select
  using (bucket_id = 'chat-media');
