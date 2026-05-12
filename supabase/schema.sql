-- ScholarScout: tracker schema with row-level security.
-- Paste this entire file into Supabase → SQL Editor → New query → Run.
-- Idempotent: safe to re-run if you tweak something.

-- ==========================================================================
-- Table: tracker_rows
-- Mirrors the Row type in components/tracker.tsx. One row per scholarship
-- the user is tracking.
-- ==========================================================================
create table if not exists public.tracker_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  award text not null default '',
  -- deadline is a free-form string in the UI ("Mar 15, 2027" / "Rolling")
  -- but the tracker's actual <input type="date"> writes ISO YYYY-MM-DD.
  -- We store it as text either way to match the existing localStorage shape.
  deadline text not null default '',
  status text not null default 'Not started',
  submitted text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracker_rows_user_id_idx on public.tracker_rows(user_id);

-- ==========================================================================
-- Table: tracker_log
-- Mirrors the WonLost type. One row per won/rejected event.
-- ==========================================================================
create table if not exists public.tracker_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Optional: which tracker_rows row this was logged from. NULL allowed
  -- because the source row may have been deleted but the log entry kept.
  source_row_id uuid references public.tracker_rows(id) on delete set null,
  name text not null default '',
  result text not null check (result in ('Won', 'Rejected')),
  amount text not null default '—',
  date text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists tracker_log_user_id_idx on public.tracker_log(user_id);

-- ==========================================================================
-- Table: tracker_materials
-- Single jsonb document per user — mirrors the localStorage ss_materials
-- shape (Record<string, boolean>) without needing a row per checkbox.
-- ==========================================================================
create table if not exists public.tracker_materials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  materials jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ==========================================================================
-- Row Level Security
-- Without these, anyone with the anon key could read everyone's tracker.
-- These policies enforce: a user can only see and modify their own rows.
-- ==========================================================================
alter table public.tracker_rows enable row level security;
alter table public.tracker_log enable row level security;
alter table public.tracker_materials enable row level security;

-- Drop and recreate policies so re-running this script picks up edits.
drop policy if exists "users can read own rows" on public.tracker_rows;
drop policy if exists "users can insert own rows" on public.tracker_rows;
drop policy if exists "users can update own rows" on public.tracker_rows;
drop policy if exists "users can delete own rows" on public.tracker_rows;

create policy "users can read own rows" on public.tracker_rows
  for select using (auth.uid() = user_id);
create policy "users can insert own rows" on public.tracker_rows
  for insert with check (auth.uid() = user_id);
create policy "users can update own rows" on public.tracker_rows
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own rows" on public.tracker_rows
  for delete using (auth.uid() = user_id);

drop policy if exists "users can read own log" on public.tracker_log;
drop policy if exists "users can insert own log" on public.tracker_log;
drop policy if exists "users can delete own log" on public.tracker_log;

create policy "users can read own log" on public.tracker_log
  for select using (auth.uid() = user_id);
create policy "users can insert own log" on public.tracker_log
  for insert with check (auth.uid() = user_id);
create policy "users can delete own log" on public.tracker_log
  for delete using (auth.uid() = user_id);

drop policy if exists "users can read own materials" on public.tracker_materials;
drop policy if exists "users can upsert own materials" on public.tracker_materials;
drop policy if exists "users can update own materials" on public.tracker_materials;

create policy "users can read own materials" on public.tracker_materials
  for select using (auth.uid() = user_id);
create policy "users can upsert own materials" on public.tracker_materials
  for insert with check (auth.uid() = user_id);
create policy "users can update own materials" on public.tracker_materials
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================================================
-- Realtime (optional)
-- Lets the client subscribe to changes — useful if a user has multiple tabs
-- open and we want one tab to reflect changes made in another.
-- Comment this out if you don't want realtime.
-- ==========================================================================
alter publication supabase_realtime add table public.tracker_rows;
alter publication supabase_realtime add table public.tracker_log;
alter publication supabase_realtime add table public.tracker_materials;
