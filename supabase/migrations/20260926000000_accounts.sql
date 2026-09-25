-- Accounts (phase F10): one profile per person plus the last values typed in each calculator.
-- Row level security: every row is visible and editable only by its owner.
-- Apply with the Supabase CLI (`supabase db push`) or paste it in the SQL editor.

-- Keeps updated_at current on every update.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles -------------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  currency text not null default 'ARS' check (currency ~ '^[A-Z]{3}$'),
  locale text check (locale in ('es', 'en')),
  color_scheme text check (color_scheme in ('light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Preferences of each person (display currency, language, theme).';

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

create policy "Profiles are visible to their owner"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Profiles are created by their owner"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy "Profiles are updated by their owner"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Calculator drafts ----------------------------------------------------------------------------

create table public.calculator_drafts (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  formula_id text not null
    check (char_length(formula_id) <= 64 and formula_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  draft jsonb not null
    check (jsonb_typeof(draft) = 'object' and pg_column_size(draft) <= 16384),
  updated_at timestamptz not null default now(),
  primary key (user_id, formula_id)
);

comment on table public.calculator_drafts is 'Last values typed in each calculator, per person.';

create trigger calculator_drafts_touch_updated_at
before update on public.calculator_drafts
for each row execute function public.touch_updated_at();

alter table public.calculator_drafts enable row level security;

create policy "Drafts are visible to their owner"
on public.calculator_drafts for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Drafts are created by their owner"
on public.calculator_drafts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Drafts are updated by their owner"
on public.calculator_drafts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Drafts are deleted by their owner"
on public.calculator_drafts for delete to authenticated
using ((select auth.uid()) = user_id);

-- Account deletion -----------------------------------------------------------------------------

-- Lets a signed-in person delete their own account. Profiles and drafts go with it (cascade).
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
