-- ============================================
-- TABLA: Contact Messages (Mensajes de Contacto)
-- ============================================

-- Crear tabla para almacenar mensajes de contacto
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false
);

-- Crear índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at 
ON contact_messages(created_at DESC);

-- Crear índice para filtrar mensajes no leídos
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read 
ON contact_messages(is_read) 
WHERE is_read = false;

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_contact_messages_email 
ON contact_messages(email);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can create contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;

-- Política: Cualquiera puede crear mensajes de contacto (sin autenticación)
CREATE POLICY "Anyone can create contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Política: Solo usuarios autenticados pueden leer mensajes
-- (En producción, deberías restringir esto solo a administradores)
-- Por ahora, cualquier usuario autenticado puede leer
CREATE POLICY "Authenticated users can view contact messages"
  ON contact_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Solo usuarios autenticados pueden actualizar mensajes
-- (Marcar como leído, archivar, etc.)
CREATE POLICY "Authenticated users can update contact messages"
  ON contact_messages FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_messages_updated_at();

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE contact_messages IS 'Almacena mensajes de contacto enviados desde el formulario público';
COMMENT ON COLUMN contact_messages.name IS 'Nombre completo del remitente';
COMMENT ON COLUMN contact_messages.email IS 'Email del remitente';
COMMENT ON COLUMN contact_messages.message IS 'Contenido del mensaje';
COMMENT ON COLUMN contact_messages.is_read IS 'Indica si el mensaje ha sido leído por un administrador';
COMMENT ON COLUMN contact_messages.is_archived IS 'Indica si el mensaje ha sido archivado';
COMMENT ON COLUMN contact_messages.read_at IS 'Fecha y hora en que el mensaje fue marcado como leído';

