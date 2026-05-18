create extension if not exists "pgcrypto";

create table if not exists public.document_annotations (
  id uuid primary key default gen_random_uuid(),
  lot_id text not null,
  review_id text not null,
  annotation_type text not null default 'note',
  body text not null,
  author_name text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_annotations_annotation_type_check check (
    annotation_type in (
      'note',
      'correction_proposal',
      'transcription_proposal',
      'translation_note',
      'metadata_note'
    )
  ),
  constraint document_annotations_status_check check (
    status in (
      'pending',
      'published',
      'rejected',
      'archived'
    )
  ),
  constraint document_annotations_body_check check (
    length(trim(body)) > 0
    and length(body) <= 5000
  ),
  constraint document_annotations_author_name_check check (
    author_name is null
    or length(trim(author_name)) between 1 and 120
  )
);

comment on table public.document_annotations is
  'Visitor annotations for archive document pages. These annotations are proposals or notes only and are not validated transcriptions.';

comment on column public.document_annotations.annotation_type is
  'Annotation category. A transcription_proposal is still only a proposal and must not be presented as a validated transcription.';

create index if not exists document_annotations_lookup_idx
  on public.document_annotations (lot_id, review_id, status, created_at desc);

create or replace function public.set_document_annotations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_document_annotations_updated_at
  on public.document_annotations;

create trigger set_document_annotations_updated_at
before update on public.document_annotations
for each row
execute function public.set_document_annotations_updated_at();

alter table public.document_annotations enable row level security;

revoke all on public.document_annotations from anon;
grant select, insert on public.document_annotations to anon;

drop policy if exists "Allow anon read published document annotations"
  on public.document_annotations;

create policy "Allow anon read published document annotations"
on public.document_annotations
for select
to anon
using (status = 'published');

drop policy if exists "Allow anon insert pending document annotations"
  on public.document_annotations;

create policy "Allow anon insert pending document annotations"
on public.document_annotations
for insert
to anon
with check (status = 'pending');
