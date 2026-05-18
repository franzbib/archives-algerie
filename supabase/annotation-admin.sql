create extension if not exists "pgcrypto";

create table if not exists public.annotation_admin_settings (
  id boolean primary key default true,
  password_hash text not null,
  updated_at timestamptz not null default now(),
  constraint annotation_admin_settings_singleton_check check (id = true)
);

comment on table public.annotation_admin_settings is
  'Stores the administrator password hash for publishing document annotation proposals. No public direct access should be granted.';

alter table public.annotation_admin_settings enable row level security;

revoke all on public.annotation_admin_settings from public;
revoke all on public.annotation_admin_settings from anon;
revoke all on public.annotation_admin_settings from authenticated;

create or replace function public.publish_document_annotation(
  annotation_id uuid,
  admin_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  stored_password_hash text;
  updated_count integer;
begin
  select password_hash
  into stored_password_hash
  from public.annotation_admin_settings
  where id = true;

  if stored_password_hash is null
    or admin_password is null
    or crypt(admin_password, stored_password_hash) <> stored_password_hash then
    return false;
  end if;

  update public.document_annotations
  set status = 'published',
      updated_at = now()
  where id = annotation_id
    and status = 'pending';

  get diagnostics updated_count = row_count;

  return updated_count = 1;
end;
$$;

comment on function public.publish_document_annotation(uuid, text) is
  'Publishes a pending document annotation as a visible reading proposal only. Published annotations are not validated transcriptions.';

create or replace function public.list_pending_document_annotations(
  page_lot_id text,
  page_review_id text,
  admin_password text
)
returns table (
  id uuid,
  lot_id text,
  review_id text,
  annotation_type text,
  body text,
  author_name text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  stored_password_hash text;
begin
  select password_hash
  into stored_password_hash
  from public.annotation_admin_settings
  where id = true;

  if stored_password_hash is null
    or admin_password is null
    or crypt(admin_password, stored_password_hash) <> stored_password_hash then
    return;
  end if;

  return query
  select
    annotations.id,
    annotations.lot_id,
    annotations.review_id,
    annotations.annotation_type,
    annotations.body,
    annotations.author_name,
    annotations.status,
    annotations.created_at,
    annotations.updated_at
  from public.document_annotations as annotations
  where annotations.lot_id = page_lot_id
    and annotations.review_id = page_review_id
    and annotations.status = 'pending'
  order by annotations.created_at asc;
end;
$$;

comment on function public.list_pending_document_annotations(text, text, text) is
  'Lists pending document annotation proposals for manual review only. These proposals are not validated transcriptions.';

create or replace function public.delete_document_annotation(
  annotation_id uuid,
  admin_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  deleted_count integer;
begin
  if not public.verify_annotation_admin_password(admin_password) then
    return false;
  end if;

  delete from public.document_annotations
  where id = annotation_id
    and status in ('pending', 'published');

  get diagnostics deleted_count = row_count;

  return deleted_count = 1;
end;
$$;

comment on function public.delete_document_annotation(uuid, text) is
  'Deletes pending or published document annotation proposals only. These annotations are not validated transcriptions.';

revoke all on function public.publish_document_annotation(uuid, text) from public;
revoke all on function public.list_pending_document_annotations(text, text, text) from public;
revoke all on function public.delete_document_annotation(uuid, text) from public;
grant execute on function public.publish_document_annotation(uuid, text) to anon;
grant execute on function public.list_pending_document_annotations(text, text, text) to anon;
grant execute on function public.delete_document_annotation(uuid, text) to anon, authenticated;

-- Example initialization. Replace the placeholder locally in Supabase SQL Editor.
-- Do not commit a real password.
--
-- insert into public.annotation_admin_settings (id, password_hash)
-- values (true, crypt('REMPLACER_PAR_UN_MOT_DE_PASSE_LONG', gen_salt('bf')))
-- on conflict (id) do update
-- set password_hash = excluded.password_hash,
--     updated_at = now();
