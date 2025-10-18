-- Script para aplicar la migración de recetas escaladas
-- Ejecuta este script en tu consola de Supabase

-- 1. Agregar columnas para recetas escaladas
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS is_scaled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;

-- 2. Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_recipes_is_scaled ON recipes(is_scaled) WHERE is_scaled = TRUE;
CREATE INDEX IF NOT EXISTS idx_recipes_original_recipe_id ON recipes(original_recipe_id) WHERE original_recipe_id IS NOT NULL;

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN recipes.is_scaled IS 'Indica si esta receta fue creada mediante el escalado de otra receta';
COMMENT ON COLUMN recipes.original_recipe_id IS 'ID de la receta original de la cual fue escalada (null si no es escalada)';

-- 4. Verificar que las columnas fueron agregadas correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recipes' 
AND column_name IN ('is_scaled', 'original_recipe_id')
ORDER BY column_name;

-- 5. Verificar índices creados
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'recipes' 
AND indexname LIKE 'idx_recipes_%scaled%'
ORDER BY indexname;

