-- Script completo para solucionar el problema de imágenes en artículos
-- Ejecutar este script completo en la consola de Supabase SQL Editor

-- 1. Verificar si el índice problemático existe
SELECT 
    indexname, 
    tablename, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'articles' 
AND indexname = 'idx_articles_image_url';

-- 2. Eliminar el índice problemático que limita el tamaño de image_url
DROP INDEX IF EXISTS idx_articles_image_url;

-- 3. Verificar que el índice se eliminó correctamente
SELECT 
    indexname, 
    tablename, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'articles' 
AND indexname = 'idx_articles_image_url';

-- 4. Verificar la estructura de la tabla articles
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'articles' 
AND column_name = 'image_url';

-- 5. Comentario explicativo
COMMENT ON COLUMN articles.image_url IS 'Optional image URL for the article. No index due to base64 size limitations. Supports images up to 1MB.';

-- Si todo se ejecutó correctamente, deberías ver:
-- - El primer SELECT debería mostrar el índice (si existe)
-- - El segundo SELECT debería estar vacío (índice eliminado)
-- - El tercer SELECT debería mostrar: image_url | text | null | YES
