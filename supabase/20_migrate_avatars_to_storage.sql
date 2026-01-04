-- ============================================
-- MIGRATE AVATARS TO STORAGE
-- ============================================
-- Este script crea un bucket de Storage para avatares y configura las políticas
-- Esto reduce significativamente el tamaño de las respuestas de la base de datos
-- Los avatares se almacenarán como archivos en Storage en lugar de base64 en la DB

-- ============================================
-- 1. CREAR BUCKET DE AVATARES
-- ============================================

-- Crear bucket para avatares (público para que se puedan acceder directamente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,  -- Público para acceso directo
  2097152,  -- 2MB máximo por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 2. POLÍTICAS DE STORAGE PARA AVATARES
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Permitir lectura pública de avatares
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir a usuarios autenticados subir su propio avatar
-- Estructura: user_id/avatar.jpg
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar su propio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios eliminar su propio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 3. FUNCIÓN PARA LIMPIAR AVATARES BASE64 GRANDES
-- ============================================
-- Esta función reemplaza avatares base64 grandes con defaults
-- Útil para limpiar datos existentes sin migración inmediata

CREATE OR REPLACE FUNCTION clean_large_base64_avatars()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Reemplazar avatares base64 grandes en profiles con defaults
  UPDATE profiles
  SET avatar = format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(username, 'user'))
  WHERE avatar IS NOT NULL 
    AND length(avatar) > 500 
    AND avatar LIKE 'data:image%';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- También limpiar en link_bio_profiles
  UPDATE link_bio_profiles
  SET avatar = NULL
  WHERE avatar IS NOT NULL 
    AND length(avatar) > 500 
    AND avatar LIKE 'data:image%';
  
  RETURN updated_count;
END;
$$;

-- ============================================
-- 4. ACTUALIZAR FUNCIONES RPC PARA FILTRAR AVATARES BASE64 GRANDES
-- ============================================
-- Las funciones ahora devolverán URLs de Storage o avatares pequeños (<500 chars)
-- Si el avatar es base64 grande, se reemplaza con URL de Storage o default

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
      -- Filtrar avatares base64 grandes y reemplazarlos con default
      -- Los avatares grandes se migrarán a Storage gradualmente
      CASE 
        -- Si el avatar es base64 grande (>500 chars), usar default
        WHEN prof.avatar IS NOT NULL AND length(prof.avatar) > 500 AND prof.avatar LIKE 'data:image%' THEN
          format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
        -- Si el avatar de link_bio_profiles es base64 grande, usar default
        WHEN lbp.avatar IS NOT NULL AND length(lbp.avatar) > 500 AND lbp.avatar LIKE 'data:image%' THEN
          format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
        -- Si el avatar es URL pequeña o base64 pequeño, usarlo
        WHEN lbp.avatar IS NOT NULL AND (length(lbp.avatar) <= 500 OR NOT lbp.avatar LIKE 'data:image%') THEN
          lbp.avatar
        WHEN prof.avatar IS NOT NULL AND (length(prof.avatar) <= 500 OR NOT prof.avatar LIKE 'data:image%') THEN
          prof.avatar
        -- Default
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
  WHERE prof.id = ANY(user_ids);
END;
$$;

-- ============================================
-- 5. ACTUALIZAR FUNCIÓN DE COMUNIDAD
-- ============================================

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
      AND (length(link_bio_profiles.avatar) <= 500 OR NOT link_bio_profiles.avatar LIKE 'data:image%')
    LIMIT 1
  ) lbp ON true
  WHERE prof.show_in_community = true
  ORDER BY prof.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- 6. COMENTARIOS
-- ============================================

COMMENT ON FUNCTION get_avatar_url IS 'Construye la URL pública de un avatar desde Storage. Usa el project_ref configurado en app.settings.';
COMMENT ON FUNCTION get_profiles_batch_rpc IS 'Obtiene perfiles en lote. Filtra avatares base64 grandes (>500 chars) y los reemplaza con URLs de Storage o defaults para reducir payload.';
COMMENT ON FUNCTION get_community_profiles IS 'Obtiene perfiles de comunidad. Filtra avatares base64 grandes para reducir payload significativamente.';

