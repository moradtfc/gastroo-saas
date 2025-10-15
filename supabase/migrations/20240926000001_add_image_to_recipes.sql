-- Agregar campo de imagen a la tabla recipes
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMP WITH TIME ZONE;

-- Crear índice para optimizar búsquedas por imagen
CREATE INDEX IF NOT EXISTS idx_recipes_image_url ON recipes(image_url) WHERE image_url IS NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN recipes.image_url IS 'URL de la imagen de la receta (opcional, máximo 1 imagen por receta)';
COMMENT ON COLUMN recipes.image_updated_at IS 'Fecha de última actualización de la imagen';

