-- ============================================
-- SIMPLIFICAR: Resource Needs - Solo campos esenciales
-- ============================================
-- Este script asegura que la tabla resource_needs tenga solo los campos esenciales:
-- - verticals (TEXT[])
-- - format_tags (TEXT[])
-- - details (TEXT)
-- - user_id (UUID, opcional)
-- - created_at (TIMESTAMPTZ, automático)

-- 1. Asegurar que las columnas esenciales existan
DO $$
BEGIN
  -- Agregar verticals si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' AND column_name = 'verticals'
  ) THEN
    ALTER TABLE resource_needs ADD COLUMN verticals TEXT[] NOT NULL DEFAULT '{}';
  END IF;

  -- Agregar format_tags si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' AND column_name = 'format_tags'
  ) THEN
    ALTER TABLE resource_needs ADD COLUMN format_tags TEXT[] NOT NULL DEFAULT '{}';
  END IF;

  -- Agregar details si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' AND column_name = 'details'
  ) THEN
    ALTER TABLE resource_needs ADD COLUMN details TEXT NOT NULL;
  END IF;

  -- Asegurar que user_id existe (debería existir, pero por si acaso)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE resource_needs ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;

  -- Asegurar que created_at existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE resource_needs ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. Asegurar que las políticas RLS permitan INSERT a cualquiera
DROP POLICY IF EXISTS "Anyone can create resource needs" ON resource_needs;
CREATE POLICY "Anyone can create resource needs"
  ON resource_needs FOR INSERT
  WITH CHECK (true);

-- 3. Asegurar permisos
GRANT INSERT ON resource_needs TO anon;
GRANT INSERT ON resource_needs TO authenticated;

-- 4. Comentarios
COMMENT ON COLUMN resource_needs.verticals IS 'Verticales de interés seleccionadas';
COMMENT ON COLUMN resource_needs.format_tags IS 'Formatos preferidos por el usuario';
COMMENT ON COLUMN resource_needs.details IS 'Descripción detallada de la necesidad';
COMMENT ON COLUMN resource_needs.user_id IS 'Usuario registrado (opcional, puede ser NULL)';

