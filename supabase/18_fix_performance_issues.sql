-- ============================================
-- FIX PERFORMANCE ISSUES
-- ============================================
-- Este script corrige los problemas de rendimiento identificados:
-- 1. Error "column reference 'avatar' is ambiguous" en get_profiles_batch_rpc
-- 2. Payloads muy grandes en queries de comunidad (5.4 MB)
-- 3. Timeouts en queries de proyectos y comunidad
-- 4. Optimización de queries para reducir tamaño de respuestas

-- ============================================
-- 1. FIX get_profiles_batch_rpc - AMBIGUOUS COLUMN ERROR
-- ============================================
-- El error ocurre porque PostgreSQL no puede resolver la referencia a 'avatar'
-- en el contexto del LATERAL JOIN. Necesitamos ser más explícitos con los alias.

CREATE OR REPLACE FUNCTION get_profiles_batch_rpc(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar TEXT,
  role TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prof.id,
    COALESCE(prof.name, 'Usuario') as name,
    COALESCE(prof.username, 'usuario') as username,
    COALESCE(
      lbp.avatar,
      prof.avatar,
      format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
    ) as avatar,
    prof.role
  FROM profiles prof
  LEFT JOIN LATERAL (
    SELECT link_bio_profiles.avatar as avatar
    FROM link_bio_profiles 
    WHERE link_bio_profiles.user_id = prof.id 
      AND link_bio_profiles.avatar IS NOT NULL 
    LIMIT 1
  ) lbp ON true
  WHERE prof.id = ANY(user_ids);
END;
$$;

-- ============================================
-- 2. OPTIMIZE COMMUNITY QUERIES - REDUCE PAYLOAD SIZE
-- ============================================
-- El problema es que los avatares pueden ser muy grandes (base64 images)
-- Necesitamos limitar el tamaño de los datos devueltos

-- Función optimizada para obtener perfiles de comunidad con avatares limitados
CREATE OR REPLACE FUNCTION get_community_profiles(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar TEXT,
  role TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prof.id,
    COALESCE(prof.name, 'Usuario') as name,
    COALESCE(prof.username, 'usuario') as username,
    -- Limitar tamaño de avatar: si es muy largo (probablemente base64), usar default
    CASE 
      WHEN prof.avatar IS NOT NULL AND length(prof.avatar) > 500 THEN
        format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
      ELSE COALESCE(
        lbp.avatar,
        prof.avatar,
        format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
      )
    END as avatar,
    prof.role
  FROM profiles prof
  LEFT JOIN LATERAL (
    SELECT link_bio_profiles.avatar as avatar
    FROM link_bio_profiles 
    WHERE link_bio_profiles.user_id = prof.id 
      AND link_bio_profiles.avatar IS NOT NULL
      AND length(link_bio_profiles.avatar) <= 500  -- Solo avatares pequeños (URLs, no base64)
    LIMIT 1
  ) lbp ON true
  WHERE prof.show_in_community = true
  ORDER BY prof.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- 3. OPTIMIZE PROJECTS QUERY - ADD LIMIT AND PAGINATION SUPPORT
-- ============================================
-- Agregar parámetros de limit y offset para paginación
-- Primero eliminamos la versión antigua sin parámetros si existe

DROP FUNCTION IF EXISTS get_projects_with_authors();

CREATE OR REPLACE FUNCTION get_projects_with_authors(
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  name TEXT,
  slogan TEXT,
  description TEXT,
  images TEXT[],
  video_url TEXT,
  website TEXT,
  categories TEXT[],
  technologies TEXT[],
  phase TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_id,
    p.name,
    p.slogan,
    p.description,
    p.images,
    p.video_url,
    p.website,
    p.categories,
    p.technologies,
    p.phase,
    p.status,
    p.created_at,
    p.updated_at,
    COALESCE(prof.name, 'Usuario') as author_name,
    COALESCE(prof.username, 'usuario') as author_username,
    -- Limitar tamaño de avatar para reducir payload
    CASE 
      WHEN lbp.avatar IS NOT NULL AND length(lbp.avatar) > 500 THEN
        format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
      WHEN prof.avatar IS NOT NULL AND length(prof.avatar) > 500 THEN
        format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
      ELSE COALESCE(
        lbp.avatar,
        prof.avatar,
        format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
      )
    END as author_avatar
  FROM projects p
  LEFT JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN LATERAL (
    SELECT link_bio_profiles.avatar as avatar
    FROM link_bio_profiles 
    WHERE link_bio_profiles.user_id = p.author_id 
      AND link_bio_profiles.avatar IS NOT NULL
      AND length(link_bio_profiles.avatar) <= 500
    LIMIT 1
  ) lbp ON true
  WHERE p.status = 'published'
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ============================================
-- 4. ADD INDEXES FOR BETTER PERFORMANCE
-- ============================================

-- Índice para optimizar queries de comunidad
CREATE INDEX IF NOT EXISTS idx_profiles_show_in_community_created_at 
ON profiles(show_in_community, created_at DESC) 
WHERE show_in_community = true;

-- Índice para optimizar búsqueda de avatares en link_bio_profiles
-- Solo indexamos user_id, no avatar (para evitar problemas de tamaño)
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_user_id_avatar_check
ON link_bio_profiles(user_id) 
WHERE avatar IS NOT NULL AND length(avatar) <= 500;

-- ============================================
-- 5. UPDATE STATISTICS
-- ============================================

ANALYZE profiles;
ANALYZE link_bio_profiles;
ANALYZE projects;

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON FUNCTION get_profiles_batch_rpc IS 'Obtiene perfiles en lote con avatares optimizados. Corregido para evitar error de columna ambigua.';
COMMENT ON FUNCTION get_community_profiles IS 'Obtiene perfiles de comunidad optimizados con avatares limitados para reducir payload (de 5+ MB a < 100 KB).';
COMMENT ON FUNCTION get_projects_with_authors IS 'Obtiene proyectos publicados con información de autores. Ahora soporta paginación con limit y offset para mejorar rendimiento.';

