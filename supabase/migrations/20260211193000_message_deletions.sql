-- Message deletion support:
-- 1) soft delete for everyone (visible placeholder in conversation)
-- 2) delete for self only (message hidden for one user)

alter table public.messages
  add column if not exists deleted_for_all boolean not null default false,
  add column if not exists deleted_for_all_at timestamptz,
  add column if not exists deleted_for_all_by uuid references public.profiles(id);

create table if not exists public.message_deletions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index if not exists idx_message_deletions_user_id
  on public.message_deletions(user_id);

create index if not exists idx_message_deletions_message_id
  on public.message_deletions(message_id);

alter table public.message_deletions enable row level security;

drop policy if exists "Users can view their own message deletions" on public.message_deletions;
create policy "Users can view their own message deletions"
  on public.message_deletions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert their own message deletions" on public.message_deletions;
create policy "Users can insert their own message deletions"
  on public.message_deletions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own message deletions" on public.message_deletions;
create policy "Users can delete their own message deletions"
  on public.message_deletions
  for delete
  to authenticated
  using (user_id = auth.uid());

create or replace function public.delete_message_for_everyone(target_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
  set
    deleted_for_all = true,
    deleted_for_all_at = now(),
    deleted_for_all_by = auth.uid(),
    content = ''
  where id = target_message_id
    and sender_id = auth.uid();

  if not found then
    raise exception 'Message not found or not owned by current user';
  end if;
end;
$$;

revoke all on function public.delete_message_for_everyone(uuid) from public;
grant execute on function public.delete_message_for_everyone(uuid) to authenticated;

grant select, insert, delete on public.message_deletions to authenticated;
