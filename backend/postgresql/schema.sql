-- Swastika Tracker Affiliates module schema (PostgreSQL)
create extension if not exists "pgcrypto";

create table if not exists businesses (
  id text primary key,
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  is_active boolean default true,
  registration_date timestamp
  with
    time zone default now (),
    created_at timestamp
  with
    time zone default now (),
    updated_at timestamp
  with
    time zone default now ()
);

create table if not exists user_business_access (
  user_id uuid not null references app_users (id) on delete cascade,
  business_id text not null references businesses (id) on delete cascade,
  primary key (user_id, business_id)
);

create table if not exists affiliates (
  id uuid primary key default gen_random_uuid (),
  business_id text not null references businesses (id),
  name text not null,
  product text not null,
  address text not null,
  phone1 varchar(10) not null,
  phone2 varchar(10) not null,
  description text not null,
  status text not null check (
    status in ('Contacted', 'Samples Given', 'Follow Up Visit')
  ),
  created_by uuid not null references app_users (id),
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create table if not exists affiliate_status_history (
  id uuid primary key default gen_random_uuid (),
  affiliate_id uuid not null references affiliates (id) on delete cascade,
  from_status text not null,
  to_status text not null,
  remark text,
  changed_by uuid not null references app_users (id),
  changed_at timestamptz not null default now ()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid (),
  actor_user_id uuid not null references app_users (id),
  business_id text not null references businesses (id),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now ()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid (),
  affiliate_id uuid not null references affiliates (id) on delete cascade,
  business_id text not null references businesses (id),
  title text not null,
  due_date date not null,
  priority text not null check (priority in ('high', 'medium', 'low')) default 'medium',
  status text not null check (status in ('pending', 'completed')) default 'pending',
  created_by uuid not null references app_users (id),
  created_at timestamptz not null default now (),
  completed_at timestamptz
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid (),
  business_id text not null references businesses (id),
  actor_user_id uuid not null references app_users (id),
  type text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now ()
);

-- Performance Indexes
create index if not exists idx_affiliates_business_updated on affiliates (business_id, updated_at desc);
create index if not exists idx_affiliates_status on affiliates (business_id, status);
create index if not exists idx_audit_business_created on audit_logs (business_id, created_at desc);
create index if not exists idx_reminders_business_due on reminders (business_id, due_date);
create index if not exists idx_activities_business_created on activities (business_id, created_at desc);

-- Optimized Performance Indexes (New)
create index if not exists idx_affiliates_business_created on affiliates (business_id, created_at desc);
create index if not exists idx_activities_affiliate_id on activities (business_id);
create index if not exists idx_affiliates_created_date on affiliates (business_id, created_at);
create index if not exists idx_uba_user_id on user_business_access (user_id);

-- Employee follow-up assignment: add assigned_to column to reminders
alter table reminders
add column if not exists assigned_to uuid references app_users (id) on delete set null;

create index if not exists idx_reminders_assigned_to on reminders (assigned_to);