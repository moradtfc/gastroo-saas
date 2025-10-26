-- Consulta para verificar si las recetas tienen imágenes guardadas
-- Ejecuta estos comandos en tu cliente de base de datos (Supabase Dashboard, psql, etc.)

-- 1. Ver la estructura de la tabla recipes (especialmente el campo image_url)
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'recipes' AND column_name = 'image_url';

-- 2. Ver todas las recetas y si tienen imagen
SELECT 
    id,
    name,
    CASE 
        WHEN image_url IS NULL THEN 'SIN IMAGEN'
        WHEN LENGTH(image_url) > 0 THEN CONCAT('CON IMAGEN (', LENGTH(image_url), ' caracteres)')
        ELSE 'IMAGEN VACÍA'
    END as estado_imagen,
    LENGTH(image_url) as longitud_imagen,
    LEFT(image_url, 50) as inicio_imagen -- Primeros 50 caracteres para verificar formato
FROM recipes 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Contar recetas con y sin imagen
SELECT 
    COUNT(*) as total_recetas,
    COUNT(image_url) as recetas_con_imagen,
    COUNT(*) - COUNT(image_url) as recetas_sin_imagen
FROM recipes;

-- 4. Ver solo recetas que tienen imagen (para verificar que se están guardando)
SELECT 
    id,
    name,
    LENGTH(image_url) as longitud_base64,
    LEFT(image_url, 100) as preview_imagen
FROM recipes 
WHERE image_url IS NOT NULL 
AND LENGTH(image_url) > 50
ORDER BY updated_at DESC;

-- 5. Buscar una receta específica por nombre (reemplaza 'Nombre de tu receta' con el nombre real)
-- SELECT 
--     id,
--     name,
--     CASE 
--         WHEN image_url IS NULL THEN 'NO TIENE IMAGEN'
--         ELSE CONCAT('TIENE IMAGEN: ', LENGTH(image_url), ' chars')
--     END as imagen_status,
--     LEFT(image_url, 50) as formato_imagen
-- FROM recipes 
-- WHERE name ILIKE '%Nombre de tu receta%';
