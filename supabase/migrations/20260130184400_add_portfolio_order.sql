-- Add display_order column to portfolio_images
alter table "public"."portfolio_images"
  add column if not exists "display_order" integer default 0;

-- Function to update display_order when a new image is added (auto-increment)
create or replace function public.handle_new_portfolio_image()
returns trigger as $$
begin
  select coalesce(max(display_order), 0) + 1 into new.display_order
  from public.portfolio_images
  where provider_id = new.provider_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run the function before insert
drop trigger if exists on_portfolio_image_created on public.portfolio_images;
create trigger on_portfolio_image_created
  before insert on public.portfolio_images
  for each row execute procedure public.handle_new_portfolio_image();
