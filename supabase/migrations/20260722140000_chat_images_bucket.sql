-- Bucket manquant pour les images du chat.
-- lib/chatImageUpload.ts envoie vers "chat-images" depuis le début, mais
-- le bucket n'a jamais été créé : chaque envoi renvoyait 404 "Bucket not found",
-- que l'app affichait comme « L'image n'a pas pu être envoyée ».

-- ============================================================
-- 1. Le bucket
--    public = true car le code utilise getPublicUrl() et l'URL est
--    stockée durablement dans le contenu du message : une URL signée
--    expirerait et casserait l'affichage des anciens messages.
--    Les noms de fichiers sont des UUID, donc non devinables.
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  10485760, -- 10 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. Envoi : réservé aux participants de la conversation
--    Chemin des fichiers : {conversation_id}/{uuid}.jpg
--    -> (storage.foldername(name))[1] = l'id de conversation
-- ============================================================
DROP POLICY IF EXISTS "chat images upload by participants" ON storage.objects;
CREATE POLICY "chat images upload by participants"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images'
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      LEFT JOIN public.providers p ON p.id = c.provider_id
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- ============================================================
-- 3. Suppression : uniquement l'auteur de l'envoi
-- ============================================================
DROP POLICY IF EXISTS "chat images deletable by owner" ON storage.objects;
CREATE POLICY "chat images deletable by owner"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'chat-images' AND owner = auth.uid());

-- ============================================================
-- 4. Lecture via l'API pour les participants.
--    (Le bucket étant public, la diffusion se fait aussi par
--     /object/public/ ; cette policy couvre les accès authentifiés.)
-- ============================================================
DROP POLICY IF EXISTS "chat images readable" ON storage.objects;
CREATE POLICY "chat images readable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'chat-images');
