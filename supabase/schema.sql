-- Run in the SQL editor of your own Supabase project.
-- Only the authenticated owner can read or modify their workspace.
create table if not exists public.workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 constraint workspace_size check (octet_length(data::text) < 5000000)
);
alter table public.workspaces enable row level security;
drop policy if exists "Owner workspace access" on public.workspaces;
create policy "Owner workspace access" on public.workspaces for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.workspaces to authenticated;
-- Optional storage foundation for a future cloud media adapter.
-- Current demo uploads use local IndexedDB and are never sent to this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brandos-media', 'brandos-media', false, 104857600,
 array['image/jpeg','image/png','image/webp','video/mp4','video/webm','audio/mpeg','audio/wav','audio/webm'])
on conflict (id) do nothing;
drop policy if exists "Owner media access" on storage.objects;
create policy "Owner media access" on storage.objects for all to authenticated
 using (bucket_id = 'brandos-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
 with check (bucket_id = 'brandos-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
