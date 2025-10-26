-- SCRIPT PARA SOLUCIONAR EL ERROR: index row requires 128160 bytes, maximum size is 8191
-- Ejecuta este script directamente en tu consola de Supabase

-- 1. Eliminar el índice problemático que causa el error
DROP INDEX IF EXISTS idx_recipes_image_url;

-- 2. Verificar que el índice fue eliminado
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_recipes_image_url';

-- 3. Verificar que la columna image_url sigue existiendo
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recipes' 
AND column_name = 'image_url';

-- El campo image_url seguirá funcionando normalmente
-- Solo se eliminó el índice que causaba el problema con datos grandes
