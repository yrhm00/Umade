-- Fonction RPC pour calculer les tags populaires du forum côté DB
-- Remplace le fetch de 500 questions + comptage en mémoire côté client

CREATE OR REPLACE FUNCTION get_popular_tags(tag_limit integer DEFAULT 20)
RETURNS TABLE(tag text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT unnest(tags) as tag, COUNT(*) as count
  FROM forum_questions
  WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  GROUP BY tag
  ORDER BY count DESC
  LIMIT tag_limit;
$$;
