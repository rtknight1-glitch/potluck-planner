-- Run this once in Supabase: Project -> SQL Editor -> New Query -> paste -> Run

create extension if not exists "pgcrypto";

create table if not exists events (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    admin_token text not null,
    title text not null,
    description text default '',
    event_date date not null,
    event_time text default '',
    location text default '',
    theme text default '',
    primary_color text default '#e07a3f',
    banner_emoji text default '🍲',
    host_name text not null,
    host_email text not null,
    reminder_start_days int default 7,
    reminder_repeat_days int,
    last_reminder_sent_on date,
    created_at timestamptz default now()
  );

create table if not exists items (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    name text not null,
    category text default '',
    needed_qty int,
    sort_order int default 0,
    created_at timestamptz default now()
  );

create table if not exists signups (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    item_id uuid references items(id) on delete cascade,
    custom_item_name text,
    guest_name text not null,
    guest_email text,
    quantity int default 1,
    note text default '',
    created_at timestamptz default now()
  );

create index if not exists idx_items_event on items(event_id);
create index if not exists idx_signups_event on signups(event_id);
create index if not exists idx_signups_item on signups(item_id);

-- Row Level Security: the app only ever talks to Supabase from the server
-- using the service_role key (which bypasses RLS), so we lock these tables
-- down completely to anon/public access as defense in depth.
alter table events enable row level security;
alter table items enable row level security;
alter table signups enable row level security;
