-- Crear tabla de categorías de recetas
CREATE TABLE IF NOT EXISTS recipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar categorías predeterminadas
INSERT INTO recipe_categories (name, icon) VALUES
  ('Entrantes', '🥗'),
  ('Plato Principal', '🍽️'),
  ('Postres', '🍰'),
  ('Sopas', '🍲'),
  ('Ensaladas', '🥙'),
  ('Arroces', '🍚'),
  ('Carnes', '🥩'),
  ('Pescados', '🐟'),
  ('Vegetariano', '🥬'),
  ('Bebidas', '🍹')
ON CONFLICT (name) DO NOTHING;

-- Crear tabla de costos adicionales de recetas
CREATE TABLE IF NOT EXISTS recipe_additional_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar nuevos campos a la tabla recipes
ALTER TABLE recipes 
  ADD COLUMN IF NOT EXISTS recipe_category_id UUID REFERENCES recipe_categories(id),
  ADD COLUMN IF NOT EXISTS cost_per_serving DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS profit_per_serving DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS profit_margin_percentage DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS ingredients_cost DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS additional_costs_total DECIMAL(10, 2);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_recipe_additional_costs_recipe_id ON recipe_additional_costs(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_recipe_category_id ON recipes(recipe_category_id);

-- Trigger para actualizar updated_at en recipe_categories
CREATE OR REPLACE FUNCTION update_recipe_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipe_categories_updated_at
  BEFORE UPDATE ON recipe_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_categories_updated_at();

-- Trigger para actualizar updated_at en recipe_additional_costs
CREATE OR REPLACE FUNCTION update_recipe_additional_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipe_additional_costs_updated_at
  BEFORE UPDATE ON recipe_additional_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_additional_costs_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE recipe_categories IS 'Categorías de recetas personalizables por el usuario';
COMMENT ON TABLE recipe_additional_costs IS 'Costos adicionales personalizados para cada receta';
COMMENT ON COLUMN recipes.cost_per_serving IS 'Costo calculado por ración';
COMMENT ON COLUMN recipes.profit_per_serving IS 'Ganancia calculada por ración';
COMMENT ON COLUMN recipes.profit_margin_percentage IS 'Margen de ganancia en porcentaje';
COMMENT ON COLUMN recipes.total_profit IS 'Ganancia total basada en el número de raciones';
COMMENT ON COLUMN recipes.total_cost IS 'Costo total de la receta (ingredientes + adicionales)';
COMMENT ON COLUMN recipes.ingredients_cost IS 'Costo total de los ingredientes';
COMMENT ON COLUMN recipes.additional_costs_total IS 'Suma de todos los costos adicionales';

