-- Milestone 1: schema + relationships + constraints + indexes
-- Safe to run via migration runner; uses a transaction there.

create extension if not exists pgcrypto;

-- ---------- enum-like types ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_role') then
    create type project_role as enum ('admin', 'member');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('todo', 'in_progress', 'done');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type task_priority as enum ('low', 'medium', 'high');
  end if;
end $$;

-- ---------- users ----------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_users_email_lower_unique on users (lower(email));

-- ---------- projects ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- project members ----------
create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role project_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- ---------- tasks ----------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  assignee_id uuid references users(id) on delete set null,
  due_date timestamptz,
  created_by uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enforce: if assignee is set, they must be a member of the project.
-- This is implemented via a trigger because it spans tables.
create or replace function ensure_assignee_is_project_member()
returns trigger as $$
begin
  if new.assignee_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from project_members pm
    where pm.project_id = new.project_id
      and pm.user_id = new.assignee_id
  ) then
    raise exception 'assignee must be a member of the project';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_assignee_member on tasks;
create trigger trg_tasks_assignee_member
before insert or update of assignee_id, project_id
on tasks
for each row
execute function ensure_assignee_is_project_member();

-- ---------- refresh tokens ----------
create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  revoked_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_refresh_tokens_user_id on refresh_tokens(user_id);
create unique index if not exists idx_refresh_tokens_token_hash on refresh_tokens(token_hash);

-- ---------- indexes ----------
create index if not exists idx_tasks_project_status on tasks(project_id, status);
create index if not exists idx_tasks_assignee_status on tasks(assignee_id, status);
create index if not exists idx_tasks_due_date on tasks(due_date);
create index if not exists idx_project_members_project_role on project_members(project_id, role);

