-- Create food_categories table for ingredient/supply categories
CREATE TABLE food_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- For UI icons
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert comprehensive food and supply categories for gastronomic businesses
INSERT INTO food_categories (id, name, description, icon) VALUES
-- Alimentos básicos
('a1111111-1111-1111-1111-111111111111', 'Carnes y Aves', 'Carnes rojas, blancas, embutidos y derivados cárnicos', '🥩'),
('a2222222-2222-2222-2222-222222222222', 'Pescados y Mariscos', 'Pescados frescos, congelados, mariscos y productos del mar', '🐟'),
('a3333333-3333-3333-3333-333333333333', 'Lácteos y Huevos', 'Leche, quesos, yogures, mantequilla, huevos y derivados', '🥛'),
('a4444444-4444-4444-4444-444444444444', 'Cereales y Granos', 'Arroz, trigo, avena, quinoa, legumbres y harinas', '🌾'),
('a5555555-5555-5555-5555-555555555555', 'Frutas y Verduras', 'Frutas frescas, verduras, hortalizas y productos vegetales', '🍎'),
('a6666666-6666-6666-6666-666666666666', 'Aceites y Grasas', 'Aceites vegetales, mantecas, margarinas y grasas comestibles', '🫒'),
('a7777777-7777-7777-7777-777777777777', 'Condimentos y Especias', 'Sal, pimienta, hierbas, especias y sazonadores', '🧂'),
('a8888888-8888-8888-8888-888888888888', 'Bebidas', 'Agua, jugos, refrescos, vinos, licores y bebidas en general', '🥤'),
('a9999999-9999-9999-9999-999999999999', 'Panadería y Repostería', 'Pan, pasteles, galletas, masas y productos horneados', '🍞'),
('b1111111-1111-1111-1111-111111111111', 'Conservas y Enlatados', 'Productos enlatados, conservas, encurtidos y preservados', '🥫'),

-- Insumos operativos
('b2222222-2222-2222-2222-222222222222', 'Envases y Embalajes', 'Cajas, bolsas, recipientes, envases desechables y embalajes', '📦'),
('b3333333-3333-3333-3333-333333333333', 'Productos de Limpieza', 'Detergentes, desinfectantes, productos de higiene y limpieza', '🧽'),
('b4444444-4444-4444-4444-444444444444', 'Utensilios de Cocina', 'Cuchillos, ollas, sartenes, herramientas de cocina', '🔪'),
('b5555555-5555-5555-5555-555555555555', 'Equipos y Maquinaria', 'Electrodomésticos, maquinaria industrial, equipos de cocina', '⚙️'),
('b6666666-6666-6666-6666-666666666666', 'Suministros de Mesa', 'Platos, vasos, cubiertos, servilletas, manteles', '🍽️'),
('b7777777-7777-7777-7777-777777777777', 'Productos Químicos', 'Aditivos alimentarios, conservantes, colorantes, químicos permitidos', '⚗️'),
('b8888888-8888-8888-8888-888888888888', 'Combustibles y Energía', 'Gas, carbón, leña, combustibles para cocción', '🔥'),
('b9999999-9999-9999-9999-999999999999', 'Papelería y Oficina', 'Papel, bolígrafos, facturas, material de oficina', '📄'),
('c1111111-1111-1111-1111-111111111111', 'Uniformes y Textiles', 'Uniformes, delantales, paños, textiles de cocina', '👕'),
('c2222222-2222-2222-2222-222222222222', 'Otros Insumos', 'Productos diversos no clasificados en otras categorías', '📋');

-- Create allergens table
CREATE TABLE allergens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    severity_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common allergens
INSERT INTO allergens (id, name, description, severity_level) VALUES
-- Alérgenos más comunes (primeros 4)
('d1111111-1111-1111-1111-111111111111', 'Gluten', 'Proteína presente en trigo, cebada, centeno y avena', 'high'),
('d2222222-2222-2222-2222-222222222222', 'Lácteos', 'Leche y productos derivados de la leche', 'high'),
('d3333333-3333-3333-3333-333333333333', 'Huevos', 'Huevos y productos que contengan huevo', 'medium'),
('d4444444-4444-4444-4444-444444444444', 'Frutos Secos', 'Almendras, nueces, avellanas, pistachos, etc.', 'critical'),

-- Otros alérgenos importantes
('d5555555-5555-5555-5555-555555555555', 'Mariscos', 'Crustáceos, moluscos y productos del mar', 'critical'),
('d6666666-6666-6666-6666-666666666666', 'Pescado', 'Pescados y productos derivados del pescado', 'high'),
('d7777777-7777-7777-7777-777777777777', 'Soja', 'Soja y productos derivados de la soja', 'medium'),
('d8888888-8888-8888-8888-888888888888', 'Sésamo', 'Semillas de sésamo y productos derivados', 'high'),
('d9999999-9999-9999-9999-999999999999', 'Sulfitos', 'Conservantes sulfitos presentes en vinos y conservas', 'medium'),
('e1111111-1111-1111-1111-111111111111', 'Apio', 'Apio y productos que contengan apio', 'low'),
('e2222222-2222-2222-2222-222222222222', 'Mostaza', 'Mostaza y productos que contengan mostaza', 'low'),
('e3333333-3333-3333-3333-333333333333', 'Altramuces', 'Altramuces y productos derivados', 'medium');

-- Add food_category_id to ingredients table
ALTER TABLE ingredients 
ADD COLUMN food_category_id UUID REFERENCES food_categories(id) ON DELETE SET NULL,
ADD COLUMN sku VARCHAR(50) UNIQUE; -- SKU field for product identification

-- Create junction table for ingredient-allergen relationships (many-to-many)
CREATE TABLE ingredient_allergens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    allergen_id UUID REFERENCES allergens(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ingredient_id, allergen_id)
);

-- Create indexes for better performance
CREATE INDEX idx_ingredients_food_category ON ingredients(food_category_id);
CREATE INDEX idx_ingredients_sku ON ingredients(sku);
CREATE INDEX idx_ingredient_allergens_ingredient ON ingredient_allergens(ingredient_id);
CREATE INDEX idx_ingredient_allergens_allergen ON ingredient_allergens(allergen_id);

-- Update existing ingredients with some default categories (optional)
UPDATE ingredients SET food_category_id = 'a5555555-5555-5555-5555-555555555555' WHERE name ILIKE '%tomate%' OR name ILIKE '%cebolla%' OR name ILIKE '%ajo%';
UPDATE ingredients SET food_category_id = 'a4444444-4444-4444-4444-444444444444' WHERE name ILIKE '%arroz%' OR name ILIKE '%harina%' OR name ILIKE '%trigo%';
UPDATE ingredients SET food_category_id = 'a6666666-6666-6666-6666-666666666666' WHERE name ILIKE '%aceite%' OR name ILIKE '%manteca%';
UPDATE ingredients SET food_category_id = 'a7777777-7777-7777-7777-777777777777' WHERE name ILIKE '%sal%' OR name ILIKE '%pimienta%' OR name ILIKE '%especias%';
