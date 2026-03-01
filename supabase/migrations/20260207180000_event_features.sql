-- Event features (Budget, Guests, Seating plan, Timeline, Checklist, Collaborators)
-- These tables are referenced by the app but were missing from the remote schema.

-- --------------------------------------------
-- Small schema additions
-- --------------------------------------------

alter table public.events
  add column if not exists cover_image text;

alter table public.forum_questions
  add column if not exists view_count integer not null default 0;

-- --------------------------------------------
-- Helper access functions (RLS)
-- --------------------------------------------

create or replace function public.is_event_owner(p_event_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.events e
    where e.id = p_event_id
      and e.client_id = auth.uid()
  );
$$;

-- --------------------------------------------
-- Tables
-- --------------------------------------------

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  category text not null,
  name text not null,
  estimated_amount numeric not null default 0,
  actual_amount numeric null,
  paid_amount numeric not null default 0,
  vendor_name text null,
  notes text null,
  due_date date null,
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budget_items_event_id_idx
  on public.budget_items(event_id);

create table if not exists public.guest_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  member_count integer not null default 0,
  status text not null default 'pending',
  category text not null default 'family',
  email text null,
  phone text null,
  notes text null,
  rsvp_date timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guest_groups_event_id_idx
  on public.guest_groups(event_id);

create table if not exists public.guest_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.guest_groups(id) on delete cascade,
  name text not null,
  meal_preference text not null default 'standard',
  dietary_notes text null,
  is_child boolean not null default false,
  age integer null,
  created_at timestamptz not null default now()
);

create index if not exists guest_group_members_group_id_idx
  on public.guest_group_members(group_id);

create table if not exists public.event_tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  shape text not null default 'round',
  capacity integer not null default 8,
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  rotation double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_tables_event_id_idx
  on public.event_tables(event_id);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text null,
  phone text null,
  status text not null default 'pending',
  category text not null default 'other',
  plus_one boolean not null default false,
  plus_one_name text null,
  plus_one_confirmed boolean not null default false,
  meal_preference text not null default 'standard',
  dietary_notes text null,
  table_id uuid null references public.event_tables(id) on delete set null,
  seat_number integer null,
  notes text null,
  rsvp_date timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guests_event_id_idx
  on public.guests(event_id);

create index if not exists guests_table_id_idx
  on public.guests(table_id);

create table if not exists public.timeline_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  type text not null default 'other',
  title text not null,
  description text null,
  start_time text not null,
  end_time text null,
  duration_minutes integer null,
  location text null,
  responsible_person text null,
  vendor_id uuid null references public.providers(id) on delete set null,
  notes text null,
  is_completed boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists timeline_items_event_id_idx
  on public.timeline_items(event_id);

create index if not exists timeline_items_event_order_idx
  on public.timeline_items(event_id, order_index);

create table if not exists public.event_checklist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text null,
  status text not null default 'todo',
  priority text not null default 'medium',
  due_date date null,
  assigned_to uuid null references public.profiles(id) on delete set null,
  assigned_name text null,
  category text null,
  order_index integer not null default 0,
  completed_at timestamptz null,
  completed_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_checklist_event_id_idx
  on public.event_checklist(event_id);

create index if not exists event_checklist_event_order_idx
  on public.event_checklist(event_id, order_index);

create table if not exists public.event_collaborators (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid null references public.profiles(id) on delete cascade,
  invited_email text null,
  role text not null default 'viewer',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_collaborators_event_user_unique unique (event_id, user_id),
  constraint event_collaborators_event_invited_email_unique unique (event_id, invited_email)
);

create index if not exists event_collaborators_event_id_idx
  on public.event_collaborators(event_id);

create index if not exists event_collaborators_user_id_idx
  on public.event_collaborators(user_id);

create table if not exists public.event_share_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  token text not null unique,
  role text not null default 'viewer',
  expires_at timestamptz not null,
  max_uses integer not null default 10,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_share_links_event_id_idx
  on public.event_share_links(event_id);

-- Now that event_collaborators exists, create the access helpers relying on it.
create or replace function public.can_view_event(p_event_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_event_owner(p_event_id)
    or exists(
      select 1
      from public.event_collaborators ec
      where ec.event_id = p_event_id
        and ec.user_id = auth.uid()
        and ec.status = 'accepted'
    );
$$;

create or replace function public.can_edit_event(p_event_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_event_owner(p_event_id)
    or exists(
      select 1
      from public.event_collaborators ec
      where ec.event_id = p_event_id
        and ec.user_id = auth.uid()
        and ec.status = 'accepted'
        and ec.role in ('owner', 'editor')
    );
$$;

-- --------------------------------------------
-- RLS + Grants
-- --------------------------------------------

alter table public.budget_items enable row level security;
alter table public.guest_groups enable row level security;
alter table public.guest_group_members enable row level security;
alter table public.event_tables enable row level security;
alter table public.guests enable row level security;
alter table public.timeline_items enable row level security;
alter table public.event_checklist enable row level security;
alter table public.event_collaborators enable row level security;
alter table public.event_share_links enable row level security;

grant select, insert, update, delete on table public.budget_items to authenticated;
grant select, insert, update, delete on table public.guest_groups to authenticated;
grant select, insert, update, delete on table public.guest_group_members to authenticated;
grant select, insert, update, delete on table public.event_tables to authenticated;
grant select, insert, update, delete on table public.guests to authenticated;
grant select, insert, update, delete on table public.timeline_items to authenticated;
grant select, insert, update, delete on table public.event_checklist to authenticated;
grant select, insert, update, delete on table public.event_collaborators to authenticated;
grant select, insert, update, delete on table public.event_share_links to authenticated;

-- budget_items
drop policy if exists "Event members can view budget items" on public.budget_items;
create policy "Event members can view budget items"
on public.budget_items for select
to authenticated
using (public.can_view_event(event_id));

drop policy if exists "Event editors can manage budget items" on public.budget_items;
create policy "Event editors can manage budget items"
on public.budget_items for all
to authenticated
using (public.can_edit_event(event_id))
with check (public.can_edit_event(event_id));

-- guest_groups
drop policy if exists "Event members can view guest groups" on public.guest_groups;
create policy "Event members can view guest groups"
on public.guest_groups for select
to authenticated
using (public.can_view_event(event_id));

drop policy if exists "Event editors can manage guest groups" on public.guest_groups;
create policy "Event editors can manage guest groups"
on public.guest_groups for all
to authenticated
using (public.can_edit_event(event_id))
with check (public.can_edit_event(event_id));

-- guest_group_members (join via guest_groups.event_id)
drop policy if exists "Event members can view guest group members" on public.guest_group_members;
create policy "Event members can view guest group members"
on public.guest_group_members for select
to authenticated
using (
  exists (
    select 1
    from public.guest_groups g
    where g.id = guest_group_members.group_id
      and public.can_view_event(g.event_id)
  )
);

drop policy if exists "Event editors can manage guest group members" on public.guest_group_members;
create policy "Event editors can manage guest group members"
on public.guest_group_members for all
to authenticated
using (
  exists (
    select 1
    from public.guest_groups g
    where g.id = guest_group_members.group_id
      and public.can_edit_event(g.event_id)
  )
)
with check (
  exists (
    select 1
    from public.guest_groups g
    where g.id = guest_group_members.group_id
      and public.can_edit_event(g.event_id)
  )
);

-- event_tables
drop policy if exists "Event members can view event tables" on public.event_tables;
create policy "Event members can view event tables"
on public.event_tables for select
to authenticated
using (public.can_view_event(event_id));

drop policy if exists "Event editors can manage event tables" on public.event_tables;
create policy "Event editors can manage event tables"
on public.event_tables for all
to authenticated
using (public.can_edit_event(event_id))
with check (public.can_edit_event(event_id));

-- guests
drop policy if exists "Event members can view guests" on public.guests;
create policy "Event members can view guests"
on public.guests for select
to authenticated
using (public.can_view_event(event_id));

drop policy if exists "Event editors can manage guests" on public.guests;
create policy "Event editors can manage guests"
on public.guests for all
to authenticated
using (public.can_edit_event(event_id))
with check (public.can_edit_event(event_id));

-- timeline_items
drop policy if exists "Event members can view timeline items" on public.timeline_items;
create policy "Event members can view timeline items"
on public.timeline_items for select
to authenticated
using (public.can_view_event(event_id));

drop policy if exists "Event editors can manage timeline items" on public.timeline_items;
create policy "Event editors can manage timeline items"
on public.timeline_items for all
to authenticated
using (public.can_edit_event(event_id))
with check (public.can_edit_event(event_id));

-- event_checklist
drop policy if exists "Event members can view checklist" on public.event_checklist;
create policy "Event members can view checklist"
on public.event_checklist for select
to authenticated
using (public.can_view_event(event_id));

drop policy if exists "Event editors can manage checklist" on public.event_checklist;
create policy "Event editors can manage checklist"
on public.event_checklist for all
to authenticated
using (public.can_edit_event(event_id))
with check (public.can_edit_event(event_id));

-- event_collaborators (avoid recursion by not calling can_* here)
drop policy if exists "Event owners can view collaborators" on public.event_collaborators;
create policy "Event owners can view collaborators"
on public.event_collaborators for select
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_collaborators.event_id
      and e.client_id = auth.uid()
  )
  or event_collaborators.user_id = auth.uid()
);

drop policy if exists "Event owners can manage collaborators" on public.event_collaborators;
create policy "Event owners can manage collaborators"
on public.event_collaborators for insert
to authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_collaborators.event_id
      and e.client_id = auth.uid()
  )
);

drop policy if exists "Event owners or invited user can update collaborator" on public.event_collaborators;
create policy "Event owners or invited user can update collaborator"
on public.event_collaborators for update
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_collaborators.event_id
      and e.client_id = auth.uid()
  )
  or event_collaborators.user_id = auth.uid()
)
with check (true);

drop policy if exists "Event owners or invited user can delete collaborator" on public.event_collaborators;
create policy "Event owners or invited user can delete collaborator"
on public.event_collaborators for delete
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_collaborators.event_id
      and e.client_id = auth.uid()
  )
  or event_collaborators.user_id = auth.uid()
);

-- event_share_links (owner/editor only)
drop policy if exists "Event editors can manage share links" on public.event_share_links;
create policy "Event editors can manage share links"
on public.event_share_links for all
to authenticated
using (public.can_edit_event(event_id))
with check (public.can_edit_event(event_id));

-- --------------------------------------------
-- RPC functions required by the app
-- --------------------------------------------

-- Guest group member counters
create or replace function public.increment_member_count(group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  select gg.event_id into v_event_id
  from public.guest_groups gg
  where gg.id = group_id;

  if v_event_id is null then
    raise exception 'guest group not found';
  end if;

  if not public.can_edit_event(v_event_id) then
    raise exception 'not authorized';
  end if;

  update public.guest_groups
  set member_count = greatest(coalesce(member_count, 0) + 1, 0),
      updated_at = now()
  where id = group_id;
end;
$$;

create or replace function public.decrement_member_count(group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  select gg.event_id into v_event_id
  from public.guest_groups gg
  where gg.id = group_id;

  if v_event_id is null then
    raise exception 'guest group not found';
  end if;

  if not public.can_edit_event(v_event_id) then
    raise exception 'not authorized';
  end if;

  update public.guest_groups
  set member_count = greatest(coalesce(member_count, 0) - 1, 0),
      updated_at = now()
  where id = group_id;
end;
$$;

revoke all on function public.increment_member_count(uuid) from public;
revoke all on function public.decrement_member_count(uuid) from public;
grant execute on function public.increment_member_count(uuid) to authenticated;
grant execute on function public.decrement_member_count(uuid) to authenticated;

-- Counters (views/likes/comments/favorites)
create or replace function public.increment_inspiration_views(insp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inspirations
  set view_count = coalesce(view_count, 0) + 1
  where id = insp_id;
end;
$$;

create or replace function public.increment_favorite_count(insp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inspirations
  set favorite_count = coalesce(favorite_count, 0) + 1
  where id = insp_id;
end;
$$;

create or replace function public.decrement_favorite_count(insp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inspirations
  set favorite_count = greatest(coalesce(favorite_count, 0) - 1, 0)
  where id = insp_id;
end;
$$;

create or replace function public.increment_story_views(story_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.provider_stories
  set view_count = coalesce(view_count, 0) + 1
  where id = story_id;
end;
$$;

create or replace function public.increment_social_post_likes(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.social_posts
  set like_count = coalesce(like_count, 0) + 1
  where id = post_id;
end;
$$;

create or replace function public.decrement_social_post_likes(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.social_posts
  set like_count = greatest(coalesce(like_count, 0) - 1, 0)
  where id = post_id;
end;
$$;

create or replace function public.increment_social_post_comments(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.social_posts
  set comment_count = coalesce(comment_count, 0) + 1
  where id = post_id;
end;
$$;

create or replace function public.decrement_social_post_comments(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.social_posts
  set comment_count = greatest(coalesce(comment_count, 0) - 1, 0)
  where id = post_id;
end;
$$;

create or replace function public.increment_forum_question_views(question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.forum_questions
  set view_count = coalesce(view_count, 0) + 1
  where id = question_id;
end;
$$;

create or replace function public.increment_post_count(cat_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.forum_categories
  set post_count = coalesce(post_count, 0) + 1
  where id = cat_id;
end;
$$;

revoke all on function public.increment_inspiration_views(uuid) from public;
revoke all on function public.increment_favorite_count(uuid) from public;
revoke all on function public.decrement_favorite_count(uuid) from public;
revoke all on function public.increment_story_views(uuid) from public;
revoke all on function public.increment_social_post_likes(uuid) from public;
revoke all on function public.decrement_social_post_likes(uuid) from public;
revoke all on function public.increment_social_post_comments(uuid) from public;
revoke all on function public.decrement_social_post_comments(uuid) from public;
revoke all on function public.increment_forum_question_views(uuid) from public;
revoke all on function public.increment_post_count(uuid) from public;

grant execute on function public.increment_inspiration_views(uuid) to anon, authenticated;
grant execute on function public.increment_favorite_count(uuid) to authenticated;
grant execute on function public.decrement_favorite_count(uuid) to authenticated;
grant execute on function public.increment_story_views(uuid) to authenticated;
grant execute on function public.increment_social_post_likes(uuid) to authenticated;
grant execute on function public.decrement_social_post_likes(uuid) to authenticated;
grant execute on function public.increment_social_post_comments(uuid) to authenticated;
grant execute on function public.decrement_social_post_comments(uuid) to authenticated;
grant execute on function public.increment_forum_question_views(uuid) to anon, authenticated;
grant execute on function public.increment_post_count(uuid) to authenticated;
