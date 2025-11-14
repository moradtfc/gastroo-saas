-- Migration: Add name and description fields to purchases table
-- Date: 2025-11-12
-- Description: Add name (required) and rename notes to description in purchases table

-- Step 1: Add name column as nullable first (to handle existing records)
ALTER TABLE purchases
ADD COLUMN name VARCHAR(255);

-- Step 2: Update existing records with a default name based on date and supplier
UPDATE purchases
SET name = CONCAT(
    'Compra ',
    TO_CHAR(purchase_date, 'DD/MM/YYYY'),
    CASE
        WHEN supplier_id IS NOT NULL THEN ' - ' || (SELECT name FROM suppliers WHERE id = purchases.supplier_id LIMIT 1)
        ELSE ''
    END
)
WHERE name IS NULL;

-- Step 3: Make name NOT NULL after filling existing records
ALTER TABLE purchases
ALTER COLUMN name SET NOT NULL;

-- Step 4: Rename notes column to description
ALTER TABLE purchases
RENAME COLUMN notes TO description;

-- Step 5: Add comment to document the fields
COMMENT ON COLUMN purchases.name IS 'Name of the purchase (required)';
COMMENT ON COLUMN purchases.description IS 'Optional description or additional notes for the purchase';
