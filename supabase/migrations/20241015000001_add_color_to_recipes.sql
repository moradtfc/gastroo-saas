-- Add color column to recipes table
-- This column stores the background color for the recipe card when no image is uploaded
-- The color is shown in both the recipe detail page and the recipe list

ALTER TABLE recipes 
ADD COLUMN color VARCHAR(20) DEFAULT '#FF9D3D';

-- Add comment to explain the column
COMMENT ON COLUMN recipes.color IS 'Background color for recipe card when no image is present (hex color code)';

