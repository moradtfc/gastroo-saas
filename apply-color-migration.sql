-- Script para aplicar la migración de color a la tabla articles
-- Ejecutar este script en la consola de Supabase o en tu cliente SQL

-- Agregar columna color a la tabla articles
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#FF9D3D';

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN articles.color IS 'Background color for the article card (hex color code). Default: #FF9D3D (orange)';

-- Crear índice para mejor rendimiento en consultas
CREATE INDEX IF NOT EXISTS idx_articles_color ON articles(color) WHERE color IS NOT NULL;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'articles' AND column_name = 'color';