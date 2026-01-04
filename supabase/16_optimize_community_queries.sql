-- ============================================
-- OPTIMIZE COMMUNITY QUERIES
-- ============================================
-- Este script crea funciones optimizadas para las consultas de la página de comunidad
-- que reducen significativamente el tamaño de los payloads (de 5+ MB a < 100 KB)

-- ============================================
-- 1. FUNCIÓN PARA OBTENER TAGS AGREGADOS POR USUARIO
-- ============================================
-- En lugar de devolver todos los proyectos (que puede ser miles de filas),
-- esta función devuelve solo los tags únicos agregados por usuario
-- Usa SECURITY INVOKER para respetar RLS policies

CREATE OR REPLACE FUNCTION get_user_tags(user_ids UUID[])
RETURNS TABLE (
  author_id UUID,
  tags TEXT[]
) 
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.author_id,
    ARRAY_AGG(DISTINCT tag) FILTER (WHERE tag IS NOT NULL) as tags
  FROM projects p
  CROSS JOIN LATERAL (
    SELECT unnest(COALESCE(p.categories, ARRAY[]::TEXT[])) as tag
    UNION
    SELECT unnest(COALESCE(p.technologies, ARRAY[]::TEXT[])) as tag
  ) AS all_tags
  WHERE p.author_id = ANY(user_ids)
    AND p.status = 'published'
  GROUP BY p.author_id;
END;
$$;

-- ============================================
-- 2. ÍNDICE PARA OPTIMIZAR LA FUNCIÓN
-- ============================================
-- Asegurar que tenemos índices en los campos que usamos

-- El índice en author_id ya existe (idx_projects_author_id)
-- El índice en status ya existe (idx_projects_status)
-- Crear índice compuesto para la consulta específica
CREATE INDEX IF NOT EXISTS idx_projects_author_status 
ON projects(author_id, status) 
WHERE status = 'published';

-- ============================================
-- 3. COMENTARIOS
-- ============================================
COMMENT ON FUNCTION get_user_tags IS 'Obtiene tags únicos (categorías y tecnologías) agregados por usuario desde proyectos publicados. Reduce significativamente el tamaño del payload comparado con devolver todos los proyectos.';

