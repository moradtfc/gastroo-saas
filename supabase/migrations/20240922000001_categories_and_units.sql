-- Migration: Categories and Units System
-- Date: 2024-09-22
-- Description: Add categories and units tables with unit conversion system

-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create units table
CREATE TABLE units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    base_unit BOOLEAN DEFAULT FALSE,
    conversion_factor DECIMAL(15,6) DEFAULT 1.0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, category_id)
);

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Masa', 'Unidades de peso y masa'),
('Volumen', 'Unidades de capacidad y volumen'),
('Cantidad', 'Unidades de conteo y cantidad'),
('Longitud', 'Unidades de distancia y longitud'),
('Área', 'Unidades de superficie'),
('Tiempo', 'Unidades de duración temporal'),
('Temperatura', 'Unidades de temperatura');

-- Insert units for Masa (Mass)
INSERT INTO units (name, symbol, category_id, base_unit, conversion_factor, description) VALUES
-- Base unit: gramo
((SELECT name FROM categories WHERE name = 'Masa'), 'g', (SELECT id FROM categories WHERE name = 'Masa'), TRUE, 1.0, 'Gramo - unidad base de masa'),
('kilogramo', 'kg', (SELECT id FROM categories WHERE name = 'Masa'), FALSE, 1000.0, 'Kilogramo'),
('miligramo', 'mg', (SELECT id FROM categories WHERE name = 'Masa'), FALSE, 0.001, 'Miligramo'),
('libra', 'lb', (SELECT id FROM categories WHERE name = 'Masa'), FALSE, 453.592, 'Libra'),
('onza', 'oz', (SELECT id FROM categories WHERE name = 'Masa'), FALSE, 28.3495, 'Onza'),
('tonelada', 't', (SELECT id FROM categories WHERE name = 'Masa'), FALSE, 1000000.0, 'Tonelada');

-- Insert units for Volumen (Volume)
INSERT INTO units (name, symbol, category_id, base_unit, conversion_factor, description) VALUES
-- Base unit: mililitro
('mililitro', 'ml', (SELECT id FROM categories WHERE name = 'Volumen'), TRUE, 1.0, 'Mililitro - unidad base de volumen'),
('litro', 'L', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 1000.0, 'Litro'),
('centilitro', 'cl', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 10.0, 'Centilitro'),
('decilitro', 'dl', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 100.0, 'Decilitro'),
('galón', 'gal', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 3785.41, 'Galón estadounidense'),
('cuarto', 'qt', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 946.353, 'Cuarto de galón'),
('pinta', 'pt', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 473.176, 'Pinta'),
('taza', 'cup', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 236.588, 'Taza'),
('cucharada', 'tbsp', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 14.7868, 'Cucharada'),
('cucharadita', 'tsp', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 4.92892, 'Cucharadita'),
('onza fluida', 'fl oz', (SELECT id FROM categories WHERE name = 'Volumen'), FALSE, 29.5735, 'Onza fluida');

-- Insert units for Cantidad (Quantity)
INSERT INTO units (name, symbol, category_id, base_unit, conversion_factor, description) VALUES
-- Base unit: unidad
('unidad', 'ud', (SELECT id FROM categories WHERE name = 'Cantidad'), TRUE, 1.0, 'Unidad - unidad base de cantidad'),
('docena', 'dz', (SELECT id FROM categories WHERE name = 'Cantidad'), FALSE, 12.0, 'Docena'),
('par', 'par', (SELECT id FROM categories WHERE name = 'Cantidad'), FALSE, 2.0, 'Par'),
('ciento', 'cto', (SELECT id FROM categories WHERE name = 'Cantidad'), FALSE, 100.0, 'Ciento'),
('millar', 'mill', (SELECT id FROM categories WHERE name = 'Cantidad'), FALSE, 1000.0, 'Millar'),
('paquete', 'paq', (SELECT id FROM categories WHERE name = 'Cantidad'), FALSE, 1.0, 'Paquete'),
('caja', 'cja', (SELECT id FROM categories WHERE name = 'Cantidad'), FALSE, 1.0, 'Caja'),
('bolsa', 'bls', (SELECT id FROM categories WHERE name = 'Cantidad'), FALSE, 1.0, 'Bolsa');

-- Insert units for Longitud (Length)
INSERT INTO units (name, symbol, category_id, base_unit, conversion_factor, description) VALUES
-- Base unit: metro
('metro', 'm', (SELECT id FROM categories WHERE name = 'Longitud'), TRUE, 1.0, 'Metro - unidad base de longitud'),
('kilómetro', 'km', (SELECT id FROM categories WHERE name = 'Longitud'), FALSE, 1000.0, 'Kilómetro'),
('centímetro', 'cm', (SELECT id FROM categories WHERE name = 'Longitud'), FALSE, 0.01, 'Centímetro'),
('milímetro', 'mm', (SELECT id FROM categories WHERE name = 'Longitud'), FALSE, 0.001, 'Milímetro'),
('pulgada', 'in', (SELECT id FROM categories WHERE name = 'Longitud'), FALSE, 0.0254, 'Pulgada'),
('pie', 'ft', (SELECT id FROM categories WHERE name = 'Longitud'), FALSE, 0.3048, 'Pie'),
('yarda', 'yd', (SELECT id FROM categories WHERE name = 'Longitud'), FALSE, 0.9144, 'Yarda');

-- Insert units for Área (Area)
INSERT INTO units (name, symbol, category_id, base_unit, conversion_factor, description) VALUES
-- Base unit: metro cuadrado
('metro cuadrado', 'm²', (SELECT id FROM categories WHERE name = 'Área'), TRUE, 1.0, 'Metro cuadrado - unidad base de área'),
('kilómetro cuadrado', 'km²', (SELECT id FROM categories WHERE name = 'Área'), FALSE, 1000000.0, 'Kilómetro cuadrado'),
('centímetro cuadrado', 'cm²', (SELECT id FROM categories WHERE name = 'Área'), FALSE, 0.0001, 'Centímetro cuadrado'),
('hectárea', 'ha', (SELECT id FROM categories WHERE name = 'Área'), FALSE, 10000.0, 'Hectárea'),
('acre', 'ac', (SELECT id FROM categories WHERE name = 'Área'), FALSE, 4046.86, 'Acre');

-- Insert units for Tiempo (Time)
INSERT INTO units (name, symbol, category_id, base_unit, conversion_factor, description) VALUES
-- Base unit: minuto
('minuto', 'min', (SELECT id FROM categories WHERE name = 'Tiempo'), TRUE, 1.0, 'Minuto - unidad base de tiempo'),
('segundo', 's', (SELECT id FROM categories WHERE name = 'Tiempo'), FALSE, 0.0166667, 'Segundo'),
('hora', 'h', (SELECT id FROM categories WHERE name = 'Tiempo'), FALSE, 60.0, 'Hora'),
('día', 'd', (SELECT id FROM categories WHERE name = 'Tiempo'), FALSE, 1440.0, 'Día'),
('semana', 'sem', (SELECT id FROM categories WHERE name = 'Tiempo'), FALSE, 10080.0, 'Semana'),
('mes', 'mes', (SELECT id FROM categories WHERE name = 'Tiempo'), FALSE, 43200.0, 'Mes (30 días)'),
('año', 'año', (SELECT id FROM categories WHERE name = 'Tiempo'), FALSE, 525600.0, 'Año (365 días)');

-- Insert units for Temperatura (Temperature)
INSERT INTO units (name, symbol, category_id, base_unit, conversion_factor, description) VALUES
-- Base unit: celsius (no conversion factor for temperature as it requires special formulas)
('celsius', '°C', (SELECT id FROM categories WHERE name = 'Temperatura'), TRUE, 1.0, 'Grados Celsius'),
('fahrenheit', '°F', (SELECT id FROM categories WHERE name = 'Temperatura'), FALSE, 1.0, 'Grados Fahrenheit'),
('kelvin', 'K', (SELECT id FROM categories WHERE name = 'Temperatura'), FALSE, 1.0, 'Kelvin');

-- Fix the first mass unit insertion (gramo was using category name instead of 'gramo')
UPDATE units SET name = 'gramo' WHERE symbol = 'g' AND category_id = (SELECT id FROM categories WHERE name = 'Masa');

-- Add foreign key constraint to ingredients table for unit_id
ALTER TABLE ingredients 
ADD COLUMN unit_id UUID REFERENCES units(id),
ADD COLUMN default_unit_id UUID REFERENCES units(id);

-- Add foreign key constraint to purchase_items table for unit_id
ALTER TABLE purchase_items 
ADD COLUMN unit_id UUID REFERENCES units(id);

-- Update existing ingredients with default units (assuming they were using basic units)
-- This is a temporary solution - in production you'd want to map existing units properly
UPDATE ingredients 
SET unit_id = (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1),
    default_unit_id = (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1)
WHERE unit = 'kg' OR unit IS NULL;

UPDATE ingredients 
SET unit_id = (SELECT id FROM units WHERE symbol = 'L' LIMIT 1),
    default_unit_id = (SELECT id FROM units WHERE symbol = 'L' LIMIT 1)
WHERE unit = 'L';

UPDATE ingredients 
SET unit_id = (SELECT id FROM units WHERE symbol = 'g' LIMIT 1),
    default_unit_id = (SELECT id FROM units WHERE symbol = 'g' LIMIT 1)
WHERE unit = 'g';

UPDATE ingredients 
SET unit_id = (SELECT id FROM units WHERE symbol = 'ud' LIMIT 1),
    default_unit_id = (SELECT id FROM units WHERE symbol = 'ud' LIMIT 1)
WHERE unit = 'ud' OR unit = 'unidad';

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_units_category_id ON units(category_id);
CREATE INDEX idx_units_symbol ON units(symbol);
CREATE INDEX idx_ingredients_unit_id ON ingredients(unit_id);
CREATE INDEX idx_ingredients_default_unit_id ON ingredients(default_unit_id);
CREATE INDEX idx_purchase_items_unit_id ON purchase_items(unit_id);
