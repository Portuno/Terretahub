-- ============================================
-- ADD COMMUNITY VISIBILITY CONTROL
-- ============================================
-- Permite a los usuarios controlar si aparecen en la sección de Comunidad

-- ============================================
-- 1. AGREGAR COLUMNA show_in_community A PROFILES
-- ============================================

-- Agregar columna show_in_community si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'show_in_community'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN show_in_community BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_profiles_show_in_community ON profiles(show_in_community);

-- Actualizar usuarios existentes para que aparezcan en comunidad por defecto
UPDATE profiles SET show_in_community = true WHERE show_in_community IS NULL;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON COLUMN profiles.show_in_community IS 'Controla si el perfil aparece en la sección de Comunidad. Por defecto true.';
