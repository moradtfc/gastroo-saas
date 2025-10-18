-- Agregar campos para recetas escaladas
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS is_scaled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_recipes_is_scaled ON recipes(is_scaled) WHERE is_scaled = TRUE;
CREATE INDEX IF NOT EXISTS idx_recipes_original_recipe_id ON recipes(original_recipe_id) WHERE original_recipe_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN recipes.is_scaled IS 'Indica si esta receta fue creada mediante el escalado de otra receta';
COMMENT ON COLUMN recipes.original_recipe_id IS 'ID de la receta original de la cual fue escalada (null si no es escalada)';

