-- Eliminar índice problemático en image_url que causa error con datos base64 grandes
-- PostgreSQL tiene un límite de 8191 bytes para índices, pero las imágenes base64 pueden ser mucho más grandes

-- Eliminar el índice existente que causa problemas
DROP INDEX IF EXISTS idx_recipes_image_url;

-- No recreamos el índice porque las búsquedas por image_url no son comunes
-- y cuando se necesiten, se pueden hacer escaneos completos de la tabla
-- En el futuro, si se necesita optimización, se podría considerar:
-- 1. Usar un campo hash de la imagen como índice
-- 2. Almacenar las imágenes en storage externo y solo guardar URLs
-- 3. Usar un campo boolean has_image para búsquedas rápidas

COMMENT ON COLUMN recipes.image_url IS 'Base64 encoded image data or URL - no index due to size constraints';
