-- ============================================
-- EVENT ROOM LAYOUTS (Plan de salle par surface)
-- ============================================

create table if not exists public.event_room_layouts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  preset_id text not null default 'classique',
  room_shape text not null default 'rectangle',
  width_m double precision not null default 16,
  height_m double precision not null default 11,
  aisle_m double precision not null default 1.6,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_room_layouts_dimensions_chk check (width_m >= 6 and height_m >= 6),
  constraint event_room_layouts_aisle_chk check (aisle_m >= 0.6),
  constraint event_room_layouts_shape_chk check (room_shape in ('rectangle', 'square', 'l_shape'))
);

create index if not exists event_room_layouts_event_id_idx
  on public.event_room_layouts(event_id);

alter table public.event_room_layouts enable row level security;

grant select, insert, update, delete on table public.event_room_layouts to authenticated;

-- event_room_layouts

drop policy if exists "Event members can view room layouts" on public.event_room_layouts;
create policy "Event members can view room layouts"
on public.event_room_layouts for select
to authenticated
using (public.can_view_event(event_id));

drop policy if exists "Event editors can manage room layouts" on public.event_room_layouts;
create policy "Event editors can manage room layouts"
on public.event_room_layouts for all
to authenticated
using (public.can_edit_event(event_id))
with check (public.can_edit_event(event_id));
