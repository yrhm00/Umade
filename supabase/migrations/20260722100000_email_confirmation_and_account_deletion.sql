-- 1) Création de profil fiable à l'inscription
-- 2) Suppression de compte confirmée par email

-- ============================================================
-- 1. handle_new_user : lire full_name / role depuis les métadonnées
--    Avec la confirmation d'email activée, signUp() n'ouvre AUCUNE session :
--    l'app ne peut donc pas faire d'UPDATE sur profiles juste après.
--    Le trigger doit donc poser lui-même le nom et le rôle.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role text;
BEGIN
  meta_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'client');
  IF meta_role NOT IN ('client', 'provider') THEN
    meta_role := 'client';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_onboarded)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    meta_role::public.user_role,
    false
  )
  ON CONFLICT (id) DO UPDATE
    SET email     = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        role      = COALESCE(public.profiles.role, EXCLUDED.role);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Demandes de suppression de compte
--    Le jeton est envoyé par email ; seule sa confirmation déclenche
--    la suppression définitive (via Edge Function en service_role).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  confirmed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user
  ON public.account_deletion_requests (user_id);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut voir ses propres demandes (pour afficher "demande en cours").
DROP POLICY IF EXISTS "own deletion requests readable" ON public.account_deletion_requests;
CREATE POLICY "own deletion requests readable"
  ON public.account_deletion_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Aucune policy d'INSERT/UPDATE/DELETE : seules les Edge Functions
-- (service_role, qui contourne RLS) écrivent dans cette table.

GRANT SELECT ON public.account_deletion_requests TO authenticated;
