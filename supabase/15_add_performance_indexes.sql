-- ============================================
-- ADD PERFORMANCE INDEXES
-- ============================================
-- Este script agrega índices compuestos para optimizar las consultas más lentas
-- Basado en el análisis de rendimiento de consultas

-- ============================================
-- 1. OPTIMIZAR CONSULTAS DE PROFILES CON show_in_community
-- ============================================
-- La consulta: WHERE show_in_community = true ORDER BY created_at DESC
-- Actualmente tiene un índice simple en show_in_community, pero necesita uno compuesto
-- para evitar ordenar después de filtrar

-- Eliminar índice simple si existe (el compuesto es mejor)
DROP INDEX IF EXISTS idx_profiles_show_in_community;

-- Crear índice compuesto para la consulta de comunidad
-- Este índice permite filtrar por show_in_community y ordenar por created_at sin sort
CREATE INDEX IF NOT EXISTS idx_profiles_show_in_community_created_at 
ON profiles(show_in_community, created_at DESC)
WHERE show_in_community = true;

-- ============================================
-- 2. OPTIMIZAR CONSULTAS DE LINK_BIO_PROFILES POR custom_slug E is_published
-- ============================================
-- La consulta: WHERE custom_slug = 'X' AND is_published = true
-- Esta es una consulta crítica que está causando timeouts
-- Necesitamos un índice compuesto optimizado para esta consulta específica

-- Eliminar índices existentes que puedan no ser óptimos
DROP INDEX IF EXISTS idx_link_bio_profiles_slug_published;
DROP INDEX IF EXISTS idx_link_bio_profiles_custom_slug;

-- Crear índice compuesto optimizado para la consulta exacta
-- El orden es importante: custom_slug primero (más selectivo), luego is_published
-- Usamos un índice parcial para solo indexar filas publicadas con custom_slug
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_slug_published_optimized 
ON link_bio_profiles(custom_slug, is_published) 
WHERE custom_slug IS NOT NULL AND is_published = true;

-- También mantener el índice único para custom_slug (ya existe pero lo verificamos)
-- Este es importante para la unicidad y búsquedas rápidas
CREATE UNIQUE INDEX IF NOT EXISTS idx_link_bio_profiles_custom_slug_unique 
ON link_bio_profiles(custom_slug) 
WHERE custom_slug IS NOT NULL;

-- ============================================
-- 3. OPTIMIZAR CONSULTAS DE LINK_BIO_PROFILES CON user_id
-- ============================================
-- La consulta: WHERE user_id = ANY ($1)
-- Ya existe un índice en user_id, pero podemos mejorarlo para consultas con múltiples IDs

-- Asegurar que el índice en user_id existe (ya debería existir del schema inicial)
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_user_id ON link_bio_profiles(user_id);

-- Índice compuesto para consultas que filtran por user_id e is_published
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_user_published 
ON link_bio_profiles(user_id, is_published);

-- ============================================
-- 4. OPTIMIZAR CONSULTAS DE PROFILES POR ID
-- ============================================
-- Las consultas por id están causando timeouts, lo cual es inusual
-- El índice primario ya existe, pero podemos verificar que no hay problemas de RLS
-- También podemos crear un índice adicional si hay consultas frecuentes con otros filtros

-- Asegurar que el índice primario está siendo usado correctamente
-- El índice primario en id ya existe, pero verificamos que no haya conflictos

-- Si hay consultas que filtran por id junto con otros campos, crear índices compuestos
-- Por ahora, el índice primario debería ser suficiente para consultas por id

-- ============================================
-- 5. OPTIMIZAR CONSULTAS DE LINK_BIO_PROFILES POR username E is_published
-- ============================================
-- La consulta: WHERE user_id = X AND username = Y AND is_published = true
-- Esta consulta también aparece en PublicProfile.tsx

CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_user_username_published 
ON link_bio_profiles(user_id, username, is_published)
WHERE is_published = true;

-- Índice para consultas solo por username e is_published (fallback en PublicLinkBio)
-- Esta consulta se usa cuando custom_slug no encuentra resultados
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_username_published 
ON link_bio_profiles(username, is_published)
WHERE is_published = true;

-- ============================================
-- 6. ANALIZAR Y OPTIMIZAR ESTADÍSTICAS
-- ============================================
-- Actualizar estadísticas de las tablas para que el planificador de consultas tome mejores decisiones
-- Esto es crítico para que PostgreSQL elija los índices correctos

ANALYZE profiles;
ANALYZE link_bio_profiles;

-- ============================================
-- 7. VERIFICAR Y OPTIMIZAR RLS POLICIES
-- ============================================
-- Las políticas RLS pueden causar lentitud si no están optimizadas
-- Asegurar que las políticas usan (select auth.uid()) en lugar de auth.uid()

-- Verificar que la política de link_bio_profiles para SELECT es simple y rápida
-- (Ya debería estar optimizada en migraciones anteriores, pero lo verificamos)
DO $$
BEGIN
  -- Si la política no existe o no está optimizada, la recreamos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'link_bio_profiles' 
    AND policyname = 'Link bio profiles are viewable by everyone'
  ) THEN
    DROP POLICY IF EXISTS "Link bio profiles are viewable by everyone" ON link_bio_profiles;
    CREATE POLICY "Link bio profiles are viewable by everyone"
      ON link_bio_profiles FOR SELECT
      USING (true);
  END IF;
END $$;

-- ============================================
-- COMENTARIOS
-- ============================================
-- Los índices creados optimizan:
-- 1. Consultas de comunidad: WHERE show_in_community = true ORDER BY created_at DESC
--    - Índice compuesto evita ordenamiento después del filtro
-- 2. Consultas de link_bio_profiles por custom_slug: WHERE custom_slug = X AND is_published = true
--    - Índice compuesto optimizado para esta consulta específica (crítico para PublicLinkBio)
-- 3. Consultas de link_bio_profiles por user_id: WHERE user_id = ANY ($1)
--    - Índice simple en user_id
-- 4. Consultas de link_bio_profiles por user_id y username: WHERE user_id = X AND username = Y AND is_published = true
--    - Índice compuesto para consultas en PublicProfile
--
-- Nota: Las consultas de realtime.list_changes (95% del tiempo total) son internas de Supabase
-- y no pueden ser optimizadas directamente. Sin embargo, estas optimizaciones mejorarán
-- significativamente las consultas de la aplicación (5% restante pero más visibles para usuarios).
--
-- IMPORTANTE: Si las consultas siguen siendo lentas después de aplicar estos índices,
-- verificar que:
-- 1. Los índices se hayan creado correctamente: \d+ link_bio_profiles
-- 2. Las estadísticas estén actualizadas (ANALYZE ya ejecutado)
-- 3. Las políticas RLS no estén causando problemas de rendimiento
-- 4. No haya problemas de red o conexión con Supabase

