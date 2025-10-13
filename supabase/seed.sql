-- Insert sample suppliers
INSERT INTO suppliers (name, address, phone, email, category, contact_person) VALUES
('Mercado Central Valencia', 'Calle Mercado 123, Valencia', '+34 96 123 4567', 'pedidos@mercadocentral.es', 'Verduras y Frutas', 'Juan García'),
('Carnicería Premium', 'Avenida Principal 45, Valencia', '+34 96 234 5678', 'info@carniceriapremium.es', 'Carnes y Embutidos', 'María López'),
('Pescados del Mar', 'Puerto de Valencia, Muelle 7', '+34 96 345 6789', 'ventas@pescadosdelmar.es', 'Pescados y Mariscos', 'Pedro Martín'),
('Lácteos Frescos SL', 'Polígono Industrial Norte 12', '+34 96 456 7890', 'comercial@lacteosfresco.es', 'Lácteos', 'Ana Ruiz');

-- Insert sample articles (inventory items) con unit_id
INSERT INTO articles (name, category, unit, unit_id, default_unit_id, cost_per_unit, current_stock, min_stock, supplier_id) VALUES
('Tomate', 'Verduras', 'kg', (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), 2.50, 25.0, 5.0, (SELECT id FROM suppliers WHERE name = 'Mercado Central Valencia')),
('Lechuga', 'Verduras', 'kg', (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), 1.80, 15.0, 3.0, (SELECT id FROM suppliers WHERE name = 'Mercado Central Valencia')),
('Cebolla', 'Verduras', 'kg', (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), 1.20, 30.0, 10.0, (SELECT id FROM suppliers WHERE name = 'Mercado Central Valencia')),
('Pimiento Rojo', 'Verduras', 'kg', (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), 3.20, 18.0, 5.0, (SELECT id FROM suppliers WHERE name = 'Mercado Central Valencia')),
('Pollo', 'Carnes', 'kg', (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), 8.50, 20.0, 5.0, (SELECT id FROM suppliers WHERE name = 'Carnicería Premium')),
('Ternera', 'Carnes', 'kg', (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), 15.20, 12.0, 3.0, (SELECT id FROM suppliers WHERE name = 'Carnicería Premium')),
('Salmón', 'Pescados', 'kg', (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), 18.90, 8.0, 2.0, (SELECT id FROM suppliers WHERE name = 'Pescados del Mar')),
('Queso Manchego', 'Lácteos', 'kg', (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), 12.50, 5.0, 2.0, (SELECT id FROM suppliers WHERE name = 'Lácteos Frescos SL')),
('Aceite de Oliva', 'Aceites y Condimentos', 'L', (SELECT id FROM units WHERE symbol = 'L' LIMIT 1), (SELECT id FROM units WHERE symbol = 'L' LIMIT 1), 8.90, 10.0, 3.0, (SELECT id FROM suppliers WHERE name = 'Mercado Central Valencia')),
('Arroz Bomba', 'Cereales y Legumbres', 'kg', (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), (SELECT id FROM units WHERE symbol = 'kg' LIMIT 1), 4.50, 15.0, 5.0, (SELECT id FROM suppliers WHERE name = 'Mercado Central Valencia'));

-- Insert sample recipes
INSERT INTO recipes (name, description, category, servings, cooking_time, difficulty, sale_price, instructions) VALUES
('Paella Valenciana', 'Auténtica paella valenciana con ingredientes tradicionales', 'Platos Principales', 4, 45, 'Intermedio', 18.50, 
'1. Calentar aceite en paellera
2. Sofreír pollo hasta dorar
3. Añadir verduras y sofreír
4. Incorporar arroz y caldo
5. Cocer 20 minutos sin remover'),

('Ensalada Mediterránea', 'Ensalada fresca con ingredientes del mediterráneo', 'Entrantes', 2, 15, 'Fácil', 8.50,
'1. Lavar y cortar verduras
2. Mezclar en bowl grande
3. Aliñar con aceite y vinagre
4. Servir fresca'),

('Salmón a la Plancha', 'Salmón fresco cocinado a la plancha con guarnición', 'Platos Principales', 1, 20, 'Intermedio', 16.90,
'1. Salpimentar el salmón
2. Calentar plancha
3. Cocinar 4 minutos por lado
4. Servir con verduras');

-- Insert recipe ingredients (usando article_id y unit_id)
INSERT INTO recipe_ingredients (recipe_id, article_id, quantity, unit, unit_id, cost) VALUES
-- Paella Valenciana
((SELECT id FROM recipes WHERE name = 'Paella Valenciana'), (SELECT id FROM articles WHERE name = 'Arroz Bomba'), 320, 'g', (SELECT id FROM units WHERE symbol = 'g' LIMIT 1), 1.44),
((SELECT id FROM recipes WHERE name = 'Paella Valenciana'), (SELECT id FROM articles WHERE name = 'Pollo'), 800, 'g', (SELECT id FROM units WHERE symbol = 'g' LIMIT 1), 6.80),
((SELECT id FROM recipes WHERE name = 'Paella Valenciana'), (SELECT id FROM articles WHERE name = 'Tomate'), 150, 'g', (SELECT id FROM units WHERE symbol = 'g' LIMIT 1), 0.38),
((SELECT id FROM recipes WHERE name = 'Paella Valenciana'), (SELECT id FROM articles WHERE name = 'Pimiento Rojo'), 100, 'g', (SELECT id FROM units WHERE symbol = 'g' LIMIT 1), 0.32),
((SELECT id FROM recipes WHERE name = 'Paella Valenciana'), (SELECT id FROM articles WHERE name = 'Aceite de Oliva'), 50, 'ml', (SELECT id FROM units WHERE symbol = 'ml' LIMIT 1), 0.45),

-- Ensalada Mediterránea
((SELECT id FROM recipes WHERE name = 'Ensalada Mediterránea'), (SELECT id FROM articles WHERE name = 'Lechuga'), 200, 'g', (SELECT id FROM units WHERE symbol = 'g' LIMIT 1), 0.36),
((SELECT id FROM recipes WHERE name = 'Ensalada Mediterránea'), (SELECT id FROM articles WHERE name = 'Tomate'), 150, 'g', (SELECT id FROM units WHERE symbol = 'g' LIMIT 1), 0.38),
((SELECT id FROM recipes WHERE name = 'Ensalada Mediterránea'), (SELECT id FROM articles WHERE name = 'Cebolla'), 50, 'g', (SELECT id FROM units WHERE symbol = 'g' LIMIT 1), 0.06),
((SELECT id FROM recipes WHERE name = 'Ensalada Mediterránea'), (SELECT id FROM articles WHERE name = 'Aceite de Oliva'), 30, 'ml', (SELECT id FROM units WHERE symbol = 'ml' LIMIT 1), 0.27),

-- Salmón a la Plancha
((SELECT id FROM recipes WHERE name = 'Salmón a la Plancha'), (SELECT id FROM articles WHERE name = 'Salmón'), 200, 'g', (SELECT id FROM units WHERE symbol = 'g' LIMIT 1), 3.78),
((SELECT id FROM recipes WHERE name = 'Salmón a la Plancha'), (SELECT id FROM articles WHERE name = 'Aceite de Oliva'), 20, 'ml', (SELECT id FROM units WHERE symbol = 'ml' LIMIT 1), 0.18);

-- Insert sample menus
INSERT INTO menus (name, description, category, status) VALUES
('Menú Mediterráneo', 'Menú completo con sabores mediterráneos', 'Diario', 'active'),
('Menú Ejecutivo', 'Menú rápido para comidas de trabajo', 'Ejecutivo', 'active');

-- Insert menu recipes
INSERT INTO menu_recipes (menu_id, recipe_id, position) VALUES
((SELECT id FROM menus WHERE name = 'Menú Mediterráneo'), (SELECT id FROM recipes WHERE name = 'Ensalada Mediterránea'), 1),
((SELECT id FROM menus WHERE name = 'Menú Mediterráneo'), (SELECT id FROM recipes WHERE name = 'Paella Valenciana'), 2),
((SELECT id FROM menus WHERE name = 'Menú Ejecutivo'), (SELECT id FROM recipes WHERE name = 'Salmón a la Plancha'), 1);

-- Insert sample purchases
INSERT INTO purchases (supplier_id, purchase_date, total_amount, status) VALUES
((SELECT id FROM suppliers WHERE name = 'Mercado Central Valencia'), '2024-09-10', 125.50, 'completed'),
((SELECT id FROM suppliers WHERE name = 'Carnicería Premium'), '2024-09-11', 85.00, 'completed');

-- Insert sample sales
INSERT INTO sales (customer_name, sale_date, total_amount, status) VALUES
('Mesa 5', '2024-09-12', 45.50, 'completed'),
('Delivery - Juan Pérez', '2024-09-12', 32.00, 'completed'),
('Mesa 8', '2024-09-13', 67.80, 'completed');

-- Insert sample expenses
INSERT INTO expenses (description, amount, category, expense_date, payment_method) VALUES
('Electricidad - Septiembre', 245.80, 'Servicios', '2024-09-01', 'Transferencia'),
('Gas - Septiembre', 156.40, 'Servicios', '2024-09-01', 'Transferencia'),
('Limpieza y mantenimiento', 89.50, 'Mantenimiento', '2024-09-05', 'Tarjeta'),
('Seguros', 320.00, 'Seguros', '2024-09-01', 'Domiciliación');
