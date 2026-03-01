-- Provider blocked dates (vacations/holidays) used by availability screens.

alter table public.providers
  add column if not exists blocked_dates jsonb not null default '[]'::jsonb;

