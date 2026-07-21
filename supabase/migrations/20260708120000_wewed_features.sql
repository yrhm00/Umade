-- WeWed-inspired features: instant booking, verified/travel badges in search,
-- personalized provider recommendations.

-- ============================================
-- 1. Instant booking flag on providers
-- ============================================
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS instant_booking_enabled boolean NOT NULL DEFAULT false;

-- ============================================
-- 2. BEFORE INSERT trigger: auto-confirm bookings for instant providers.
--    Keeps the logic server-side so RLS policies on status stay untouched.
-- ============================================
CREATE OR REPLACE FUNCTION public.apply_instant_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' AND EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = NEW.provider_id
      AND p.instant_booking_enabled = true
  ) THEN
    NEW.status := 'confirmed';
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_instant_booking ON public.bookings;
CREATE TRIGGER trg_instant_booking
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_instant_booking();

-- ============================================
-- 3. search_providers_v2: same contract as search_providers, plus
--    is_verified / service_radius_km / instant_booking_enabled columns
--    and an optional p_instant_only filter.
-- ============================================
CREATE OR REPLACE FUNCTION public.search_providers_v2(
  p_category_slug text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_search_query text DEFAULT NULL,
  p_instant_only boolean DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  business_name text,
  description text,
  category_id uuid,
  category_name text,
  category_slug text,
  city text,
  average_rating numeric,
  review_count integer,
  min_price numeric,
  portfolio_image text,
  is_verified boolean,
  service_radius_km integer,
  instant_booking_enabled boolean
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    p.user_id,
    p.business_name,
    p.description,
    p.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    p.city,
    p.average_rating,
    p.review_count,
    (SELECT MIN(s.price) FROM public.services s
      WHERE s.provider_id = p.id AND s.is_active = true) AS min_price,
    (SELECT pi.image_url FROM public.portfolio_images pi
      WHERE pi.provider_id = p.id
      ORDER BY pi.display_order ASC LIMIT 1) AS portfolio_image,
    p.is_verified,
    p.service_radius_km,
    p.instant_booking_enabled
  FROM public.providers p
  JOIN public.categories c ON c.id = p.category_id
  WHERE p.is_active = true
    AND (p_category_slug IS NULL OR c.slug = p_category_slug)
    AND (p_city IS NULL OR p.city ILIKE p_city)
    AND (p_min_rating IS NULL OR p.average_rating >= p_min_rating)
    AND (p_instant_only IS NOT TRUE OR p.instant_booking_enabled = true)
    AND (p_search_query IS NULL OR (
      p.business_name ILIKE '%' || p_search_query || '%'
      OR p.description ILIKE '%' || p_search_query || '%'
      OR c.name ILIKE '%' || p_search_query || '%'
    ))
    AND (p_min_price IS NULL OR COALESCE((
      SELECT MIN(s.price) FROM public.services s
      WHERE s.provider_id = p.id AND s.is_active = true), 0) >= p_min_price)
    AND (p_max_price IS NULL OR COALESCE((
      SELECT MIN(s.price) FROM public.services s
      WHERE s.provider_id = p.id AND s.is_active = true), 0) <= p_max_price)
  ORDER BY
    p.is_verified DESC NULLS LAST,
    p.average_rating DESC NULLS LAST,
    p.review_count DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================
-- 4. get_recommended_providers: scored matching for the Home screen.
--    Score = city match (3) + verified (2) + rating (0..2)
--            + budget fit (1.5) + instant booking (0.5)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_recommended_providers(
  p_city text DEFAULT NULL,
  p_max_budget numeric DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  business_name text,
  description text,
  category_id uuid,
  category_name text,
  category_slug text,
  city text,
  average_rating numeric,
  review_count integer,
  min_price numeric,
  portfolio_image text,
  is_verified boolean,
  service_radius_km integer,
  instant_booking_enabled boolean,
  match_score numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id,
      p.user_id,
      p.business_name,
      p.description,
      p.category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      p.city,
      p.average_rating,
      p.review_count,
      (SELECT MIN(s.price) FROM public.services s
        WHERE s.provider_id = p.id AND s.is_active = true) AS min_price,
      (SELECT pi.image_url FROM public.portfolio_images pi
        WHERE pi.provider_id = p.id
        ORDER BY pi.display_order ASC LIMIT 1) AS portfolio_image,
      p.is_verified,
      p.service_radius_km,
      p.instant_booking_enabled
    FROM public.providers p
    JOIN public.categories c ON c.id = p.category_id
    WHERE p.is_active = true
  )
  SELECT
    b.*,
    (
      (CASE WHEN p_city IS NOT NULL AND b.city ILIKE p_city THEN 3
            WHEN p_city IS NOT NULL AND COALESCE(b.service_radius_km, 0) >= 100 THEN 1.5
            ELSE 0 END)
      + (CASE WHEN b.is_verified THEN 2 ELSE 0 END)
      + COALESCE(b.average_rating, 0) / 5.0 * 2
      + (CASE WHEN p_max_budget IS NOT NULL
               AND b.min_price IS NOT NULL
               AND b.min_price <= p_max_budget THEN 1.5 ELSE 0 END)
      + (CASE WHEN b.instant_booking_enabled THEN 0.5 ELSE 0 END)
    )::numeric AS match_score
  FROM base b
  ORDER BY match_score DESC, b.review_count DESC NULLS LAST
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_providers_v2 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommended_providers TO anon, authenticated;
