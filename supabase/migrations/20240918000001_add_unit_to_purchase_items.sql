-- Add unit column to purchase_items table
-- This column will store the unit in which the ingredient is being purchased
ALTER TABLE purchase_items 
ADD COLUMN unit VARCHAR(50) NOT NULL DEFAULT 'kg';

-- Update the default value for existing records to match common units
-- We'll set it to 'kg' as default but this can be updated per purchase
UPDATE purchase_items SET unit = 'kg' WHERE unit = 'kg';

-- Add comment to document the column purpose
COMMENT ON COLUMN purchase_items.unit IS 'Unit of measurement for the purchased ingredient (kg, L, unidad, etc.)';

-- Create index for better performance on unit queries if needed
CREATE INDEX idx_purchase_items_unit ON purchase_items(unit);
