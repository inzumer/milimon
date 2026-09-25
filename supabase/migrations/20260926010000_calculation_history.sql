-- Calculation history: the whole calculations (inputs, result and steps) each person chose to
-- keep, at most 15 (the oldest are dropped automatically). Same limit as HISTORY_LIMIT in
-- src/repositories/history.

create table public.calculation_history (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Generated on the device (crypto.randomUUID), so an entry keeps its id offline and online.
  id text not null check (char_length(id) between 1 and 64),
  formula_id text not null
    check (char_length(formula_id) <= 64 and formula_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  saved_at timestamptz not null default now(),
  -- What the person entered, exactly as typed.
  draft jsonb not null
    check (jsonb_typeof(draft) = 'object' and pg_column_size(draft) <= 16384),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  -- Snapshot of the whole result (every value and every step), as the calculator showed it.
  result jsonb not null
    check (jsonb_typeof(result) = 'object' and pg_column_size(result) <= 65536),
  headline jsonb check (headline is null or jsonb_typeof(headline) = 'object'),
  primary key (user_id, id)
);

comment on table public.calculation_history is 'Saved calculations per person (latest 15).';

create index calculation_history_user_saved_at
on public.calculation_history (user_id, saved_at desc);

alter table public.calculation_history enable row level security;

create policy "History is visible to its owner"
on public.calculation_history for select to authenticated
using ((select auth.uid()) = user_id);

create policy "History is created by its owner"
on public.calculation_history for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "History is updated by its owner"
on public.calculation_history for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "History is deleted by its owner"
on public.calculation_history for delete to authenticated
using ((select auth.uid()) = user_id);

-- Keeps only the latest 15 entries of the person who just saved one.
create or replace function public.trim_calculation_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.calculation_history
  where user_id = new.user_id
    and id not in (
      select id from public.calculation_history
      where user_id = new.user_id
      order by saved_at desc
      limit 15
    );
  return null;
end;
$$;

create trigger calculation_history_trim
after insert on public.calculation_history
for each row execute function public.trim_calculation_history();
