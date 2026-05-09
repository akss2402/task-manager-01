-- Add role to users table
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'member');
  end if;
end $$;

alter table users add column if not exists role user_role not null default 'member';
