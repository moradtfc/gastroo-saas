-- Agregar campo unit_id a recipe_ingredients para mejorar el sistema de conversión de unidades
ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_unit_id ON recipe_ingredients(unit_id);

-- Comentario para documentación
COMMENT ON COLUMN recipe_ingredients.unit_id IS 'Referencia a la unidad utilizada en la receta (puede ser diferente a la unidad base del artículo)';

