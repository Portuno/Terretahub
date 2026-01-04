-- ============================================
-- CLEAN LARGE BASE64 AVATARS
-- ============================================
-- Este script limpia los avatares base64 grandes existentes
-- Los reemplaza con avatares por defecto (DiceBear) para reducir payloads inmediatamente
-- Los usuarios pueden subir nuevos avatares que se guardarán en Storage

-- ============================================
-- 1. LIMPIAR AVATARES GRANDES EN PROFILES
-- ============================================

-- Reemplazar avatares base64 grandes con defaults
UPDATE profiles
SET avatar = format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(username, id::text))
WHERE avatar IS NOT NULL 
  AND length(avatar) > 500 
  AND avatar LIKE 'data:image%';

-- ============================================
-- 2. LIMPIAR AVATARES GRANDES EN LINK_BIO_PROFILES
-- ============================================

-- Eliminar avatares base64 grandes (se usarán los de profiles)
UPDATE link_bio_profiles
SET avatar = NULL
WHERE avatar IS NOT NULL 
  AND length(avatar) > 500 
  AND avatar LIKE 'data:image%';

-- ============================================
-- 3. COMENTARIOS
-- ============================================

-- NOTA: Este script limpia los avatares base64 grandes existentes
-- Los usuarios pueden subir nuevos avatares que se guardarán automáticamente en Storage
-- Esto reduce inmediatamente el tamaño de las respuestas de la base de datos

