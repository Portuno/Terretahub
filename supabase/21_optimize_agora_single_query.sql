-- ============================================
-- OPTIMIZE AGORA WITH SINGLE QUERY
-- ============================================
-- Esta función combina posts, comments y profiles en UNA sola query
-- Reduce significativamente el número de round trips y el tiempo de carga
-- Filtra avatares base64 grandes para reducir payload

CREATE OR REPLACE FUNCTION get_agora_feed(limit_posts INTEGER DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  result JSON;
BEGIN
  WITH posts_data AS (
    SELECT 
      p.id,
      p.author_id,
      p.content,
      p.created_at,
      p.updated_at
    FROM agora_posts p
    ORDER BY p.created_at DESC
    LIMIT limit_posts
  ),
  comments_data AS (
    SELECT 
      c.id,
      c.post_id,
      c.author_id,
      c.content,
      c.created_at
    FROM agora_comments c
    WHERE c.post_id IN (SELECT id FROM posts_data)
    ORDER BY c.created_at ASC
  ),
  all_author_ids AS (
    SELECT DISTINCT author_id FROM posts_data
    UNION
    SELECT DISTINCT author_id FROM comments_data
  ),
  profiles_data AS (
    SELECT 
      prof.id,
      COALESCE(prof.name, 'Usuario') as name,
      COALESCE(prof.username, 'usuario') as username,
      -- Filtrar avatares base64 grandes
      CASE 
        WHEN prof.avatar IS NOT NULL AND length(prof.avatar) > 500 AND prof.avatar LIKE 'data:image%' THEN
          format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
        WHEN lbp.avatar IS NOT NULL AND length(lbp.avatar) > 500 AND lbp.avatar LIKE 'data:image%' THEN
          format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
        WHEN lbp.avatar IS NOT NULL AND (length(lbp.avatar) <= 500 OR NOT lbp.avatar LIKE 'data:image%') THEN
          lbp.avatar
        WHEN prof.avatar IS NOT NULL AND (length(prof.avatar) <= 500 OR NOT prof.avatar LIKE 'data:image%') THEN
          prof.avatar
        ELSE
          format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
      END as avatar,
      prof.role
    FROM profiles prof
    LEFT JOIN LATERAL (
      SELECT link_bio_profiles.avatar as avatar
      FROM link_bio_profiles 
      WHERE link_bio_profiles.user_id = prof.id 
        AND link_bio_profiles.avatar IS NOT NULL 
      LIMIT 1
    ) lbp ON true
    WHERE prof.id IN (SELECT author_id FROM all_author_ids)
  )
  SELECT json_build_object(
    'posts', (
      SELECT json_agg(
        json_build_object(
          'id', p.id,
          'author_id', p.author_id,
          'content', p.content,
          'created_at', p.created_at,
          'updated_at', p.updated_at,
          'author', (
            SELECT json_build_object(
              'id', pr.id,
              'name', pr.name,
              'username', pr.username,
              'avatar', pr.avatar,
              'role', pr.role
            )
            FROM profiles_data pr
            WHERE pr.id = p.author_id
            LIMIT 1
          ),
          'comments', (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'author_id', c.author_id,
                'content', c.content,
                'created_at', c.created_at,
                'author', (
                  SELECT json_build_object(
                    'id', pr.id,
                    'name', pr.name,
                    'username', pr.username,
                    'avatar', pr.avatar,
                    'role', pr.role
                  )
                  FROM profiles_data pr
                  WHERE pr.id = c.author_id
                  LIMIT 1
                )
              )
              ORDER BY c.created_at ASC
            )
            FROM comments_data c
            WHERE c.post_id = p.id
          )
        )
        ORDER BY p.created_at DESC
      )
      FROM posts_data p
    )
  ) INTO result;
  
  RETURN COALESCE(result, '{"posts":[]}'::json);
END;
$$;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON FUNCTION get_agora_feed IS 'Obtiene el feed completo de Ágora (posts, comments y profiles) en una sola query optimizada. Filtra avatares base64 grandes para reducir payload significativamente.';

