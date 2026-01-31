-- 1. SETUP STORAGE (BUCKET & POLICIES)
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Drop existing policies to ensure clean state
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow public viewing" on storage.objects;
drop policy if exists "Allow owners to delete" on storage.objects;

-- Create restrictive policies
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'portfolio' );

create policy "Allow public viewing"
on storage.objects for select
to public
using ( bucket_id = 'portfolio' );

create policy "Allow owners to update/delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'portfolio' and owner = auth.uid() );

-- 2. SETUP DATABASE TABLE (portfolio_images)
create table if not exists public.portfolio_images (
    id uuid default gen_random_uuid() primary key,
    provider_id uuid references public.providers(id) on delete cascade not null,
    image_url text not null,
    created_at timestamptz default now(),
    display_order integer default 0
);

-- Enable RLS
alter table public.portfolio_images enable row level security;

-- Drop existing policies
drop policy if exists "Enable read access for all users" on public.portfolio_images;
drop policy if exists "Enable insert for providers own portfolio" on public.portfolio_images;
drop policy if exists "Enable delete for providers own portfolio" on public.portfolio_images;
drop policy if exists "Enable update for providers own portfolio" on public.portfolio_images;

-- Create policies
create policy "Enable read access for all users"
on public.portfolio_images for select
using (true);

create policy "Enable insert for providers own portfolio"
on public.portfolio_images for insert
to authenticated
with check (
  provider_id in (
    select id from providers where user_id = auth.uid()
  )
);

create policy "Enable delete for providers own portfolio"
on public.portfolio_images for delete
to authenticated
using (
  provider_id in (
    select id from providers where user_id = auth.uid()
  )
);

create policy "Enable update for providers own portfolio"
on public.portfolio_images for update
to authenticated
using (
  provider_id in (
    select id from providers where user_id = auth.uid()
  )
);

-- 3. SETUP SORTING LOGIC (Optional but recommended)
-- Function to set default order
create or replace function public.handle_new_portfolio_image()
returns trigger as $$
begin
  if new.display_order is null or new.display_order = 0 then
      select coalesce(max(display_order), 0) + 1 into new.display_order
      from public.portfolio_images
      where provider_id = new.provider_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_portfolio_image_created on public.portfolio_images;
create trigger on_portfolio_image_created
  before insert on public.portfolio_images
  for each row execute procedure public.handle_new_portfolio_image();
