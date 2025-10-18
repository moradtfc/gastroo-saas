-- Script para eliminar el índice problemático de image_url
-- Ejecutar este script en la consola de Supabase o en tu cliente SQL

-- Eliminar el índice que está causando el error de tamaño
DROP INDEX IF EXISTS idx_articles_image_url;

-- Verificar que el índice se eliminó correctamente
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename = 'articles' AND indexname = 'idx_articles_image_url';

-- Si no devuelve resultados, significa que el índice se eliminó correctamente
