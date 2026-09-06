-- FinGoal MVP schema for Supabase (Postgres)
-- Run this in the Supabase SQL editor. Auth users come from auth.users;
-- every other table is scoped by user_id + context ('personal' | 'business')
-- so personal and business data never mix.

create type app_context as enum ('personal', 'business');

create table if not exists context_settings (
  user_id uuid references auth.users(id) on delete cascade,
  context app_context not null,
  monthly_income numeric not null default 0,
  needs_budget jsonb not null default '{}'::jsonb, -- {housing, transport, groceries, health}
  has_debts boolean not null default false,
  onboarded boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, context)
);

create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  context app_context not null,
  name text not null,
  balance numeric not null default 0,
  rate numeric not null default 0,          -- annual %
  term_months int not null default 0,
  min_payment numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  context app_context not null,
  amount numeric not null,
  date date not null,
  comment text,
  "group" text not null check ("group" in ('needs','wants','savings')),
  category_key text not null,
  sub text,
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  context app_context not null,
  name text not null,
  target_amount numeric not null,
  saved_amount numeric not null default 0,
  deadline date not null,
  priority int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  context app_context not null,
  date date not null,
  done boolean not null default true,
  unique (user_id, context, date)
);

-- Next step (insights & lessons) — tables reserved, not yet wired in the UI.
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  context app_context not null,
  period text not null, -- e.g. '2026-08' or '2026-W35'
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  body text not null,
  unlock_condition text not null -- e.g. 'no_emergency_fund'
);

create table if not exists user_lessons (
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  context app_context not null,
  completed_at timestamptz,
  primary key (user_id, lesson_id, context)
);

-- Row Level Security: every table is private to its owning user.
alter table context_settings enable row level security;
alter table debts enable row level security;
alter table transactions enable row level security;
alter table goals enable row level security;
alter table checkins enable row level security;
alter table insights enable row level security;
alter table user_lessons enable row level security;

create policy "owner rw" on context_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner rw" on debts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner rw" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner rw" on goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner rw" on checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner rw" on insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner rw" on user_lessons for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- lessons table is shared reference content, readable by any authenticated user
alter table lessons enable row level security;
create policy "read all" on lessons for select using (auth.role() = 'authenticated');
