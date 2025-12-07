-- ============================================
-- ADD WEBSITE FIELD TO PROJECTS TABLE
-- ============================================
-- Este script agrega el campo 'website' a la tabla projects
-- para permitir que los proyectos incluyan un enlace a su sitio web

-- Agregar columna website si no existe
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS website TEXT;

-- Comentario para documentar la columna
COMMENT ON COLUMN projects.website IS 'URL del sitio web del proyecto (opcional)';
