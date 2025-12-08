-- ============================================
-- TABLA: Resource Needs (Solicitudes de Recursos/Colaboración)
-- ============================================

CREATE TABLE IF NOT EXISTS resource_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  need_types TEXT[] NOT NULL DEFAULT '{}',
  format_tags TEXT[] NOT NULL DEFAULT '{}',
  verticals TEXT[] NOT NULL DEFAULT '{}',
  details TEXT NOT NULL,
  placeholder_used TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'resolved')),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para orden cronológico
CREATE INDEX IF NOT EXISTS idx_resource_needs_created_at
ON resource_needs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE resource_needs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create resource needs" ON resource_needs;
DROP POLICY IF EXISTS "Authenticated users can view resource needs" ON resource_needs;
DROP POLICY IF EXISTS "Authenticated users can update resource needs" ON resource_needs;

-- Cualquiera puede enviar su necesidad (no requiere sesión)
CREATE POLICY "Anyone can create resource needs"
  ON resource_needs FOR INSERT
  WITH CHECK (true);

-- Usuarios autenticados pueden ver necesidades (para priorizar contenido)
CREATE POLICY "Authenticated users can view resource needs"
  ON resource_needs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Usuarios autenticados pueden actualizar (marcar como revisado/resuelto)
CREATE POLICY "Authenticated users can update resource needs"
  ON resource_needs FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TRIGGER updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_resource_needs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_resource_needs_updated_at ON resource_needs;
CREATE TRIGGER update_resource_needs_updated_at
  BEFORE UPDATE ON resource_needs
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_needs_updated_at();

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE resource_needs IS 'Solicitudes de recursos y colaboración de la comunidad';
COMMENT ON COLUMN resource_needs.user_id IS 'Usuario autenticado que envía la solicitud (opcional)';
COMMENT ON COLUMN resource_needs.need_types IS 'Tipos de recurso solicitados (plantillas, fondos, etc.)';
COMMENT ON COLUMN resource_needs.format_tags IS 'Formatos preferidos (podcast, PDF, video, etc.)';
COMMENT ON COLUMN resource_needs.verticals IS 'Verticales de interés (Tecnología, Arte & Educación, etc.)';
COMMENT ON COLUMN resource_needs.details IS 'Descripción detallada de la necesidad';
COMMENT ON COLUMN resource_needs.status IS 'Estado de seguimiento (new, in_review, resolved)';
COMMENT ON COLUMN resource_needs.placeholder_used IS 'Placeholder de guía mostrado al usuario';
COMMENT ON COLUMN resource_needs.user_agent IS 'User-Agent del cliente que envía la necesidad';
