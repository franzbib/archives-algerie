create extension if not exists "pgcrypto";

create table if not exists public.human_review_notes (
  id uuid primary key default gen_random_uuid(),
  lot_id text not null,
  review_id text not null,
  status text not null,
  proposed_transcription text,
  notes text,
  proper_names_notes text,
  places_notes text,
  dates_notes text,
  acronyms_notes text,
  reviewed_by text,
  validated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint human_review_notes_status_check check (
    status in (
      'not_reviewed',
      'in_review',
      'correction_proposed',
      'partially_validated',
      'validated',
      'needs_image_check',
      'unreadable'
    )
  )
);

create index if not exists human_review_notes_lot_review_idx
  on public.human_review_notes (lot_id, review_id);

create index if not exists human_review_notes_status_idx
  on public.human_review_notes (status);

create or replace function public.set_human_review_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_human_review_notes_updated_at
  on public.human_review_notes;

create trigger set_human_review_notes_updated_at
before update on public.human_review_notes
for each row
execute function public.set_human_review_notes_updated_at();

alter table public.human_review_notes enable row level security;

drop policy if exists "Allow public read human review notes"
  on public.human_review_notes;

create policy "Allow public read human review notes"
on public.human_review_notes
for select
to anon
using (true);

drop policy if exists "Allow public insert human review proposals"
  on public.human_review_notes;

create policy "Allow public insert human review proposals"
on public.human_review_notes
for insert
to anon
with check (validated = false);

comment on table public.human_review_notes is
  'Human review proposals for archive lot pages. Proposals are not validated transcriptions by default.';
