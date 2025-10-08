-- Create table for in-person consultations
create table if not exists public.in_person_consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionist_profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  status text not null default 'confirmed' check (status in ('scheduled','confirmed','completed','cancelled','no_show')),
  type text not null default 'consultation' check (type in ('consultation','follow_up','emergency')),
  patient_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Enable RLS
alter table public.in_person_consultations enable row level security;

-- Patient can SELECT own consultations
create policy patient_select_in_person_consultations on public.in_person_consultations
for select to authenticated
using (
  exists (
    select 1 from public.patient_profiles p
    where p.id = in_person_consultations.patient_id
      and p.user_id = auth.uid()
  )
);

-- Patient can INSERT own consultations
create policy patient_insert_in_person_consultations on public.in_person_consultations
for insert to authenticated
with check (
  exists (
    select 1 from public.patient_profiles p
    where p.id = in_person_consultations.patient_id
      and p.user_id = auth.uid()
  )
);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_in_person_consultations_updated_at on public.in_person_consultations;

create trigger set_in_person_consultations_updated_at
before update on public.in_person_consultations
for each row
execute function public.set_updated_at();

-- helpful indexes
create index if not exists idx_in_person_consultations_patient_id on public.in_person_consultations(patient_id);
create index if not exists idx_in_person_consultations_nutritionist_id on public.in_person_consultations(nutritionist_id);
create index if not exists idx_in_person_consultations_scheduled_at on public.in_person_consultations(scheduled_at);
create index if not exists idx_in_person_consultations_status on public.in_person_consultations(status);