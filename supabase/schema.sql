-- TalkWright schema
-- Run this in Supabase SQL editor

-- Users (synced from Clerk via webhook)
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  clerk_id    text unique not null,
  email       text not null,
  first_name  text default '',
  last_name   text default '',
  created_at  timestamptz default now()
);

-- Early access email list
create table if not exists early_access (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  created_at timestamptz default now()
);

-- Talks
create table if not exists talks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete cascade,
  title             text not null default '',
  category          text not null default 'other',
  content           text not null default '',
  notes             text default '',          -- private speaker notes
  is_public         boolean default false,    -- opt-in sharing (v1.5)
  allowed_as_template boolean default false, -- opt-in template library (v1.5)
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger talks_updated_at
  before update on talks
  for each row execute function update_updated_at();

-- RLS policies
alter table users enable row level security;
alter table talks enable row level security;
alter table early_access enable row level security;

-- Service role bypasses RLS (used server-side only)
-- No client-side access to any table
