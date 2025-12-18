-- ============================================
-- Migración: feedback_messages -> eliminar columna name
-- ============================================

BEGIN;

-- Eliminamos la columna name ya que ahora solo usamos username
ALTER TABLE feedback_messages
  DROP COLUMN IF EXISTS name;

-- Comentario actualizado para reflejar el nuevo modelo
COMMENT ON TABLE feedback_messages IS 'Feedback enviado desde el frontend (opcionalmente anónimo, usando username o "anonimo").';

COMMIT;


