-- Migration: Rename ingredients table to articles and add image field
-- Date: 2024-10-02
-- Description: Rename ingredients table to articles for consistency with inventory module
--              Add optional image_url field limited to 1 image per product

-- Step 1: Rename the table
ALTER TABLE ingredients RENAME TO articles;

-- Step 2: Add image_url field (optional, limited to 1 image per article)
ALTER TABLE articles 
ADD COLUMN image_url TEXT,
ADD COLUMN image_updated_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Update foreign key references in related tables

-- Update recipe_ingredients table
ALTER TABLE recipe_ingredients 
RENAME COLUMN ingredient_id TO article_id;

-- Update purchase_items table
ALTER TABLE purchase_items 
RENAME COLUMN ingredient_id TO article_id;

-- Update ingredient_allergens junction table
ALTER TABLE ingredient_allergens RENAME TO article_allergens;
ALTER TABLE article_allergens 
RENAME COLUMN ingredient_id TO article_id;

-- Step 4: Rename foreign key constraints
ALTER TABLE articles RENAME CONSTRAINT ingredients_supplier_id_fkey TO articles_supplier_id_fkey;
ALTER TABLE articles RENAME CONSTRAINT ingredients_unit_id_fkey TO articles_unit_id_fkey;
ALTER TABLE articles RENAME CONSTRAINT ingredients_default_unit_id_fkey TO articles_default_unit_id_fkey;
ALTER TABLE articles RENAME CONSTRAINT ingredients_food_category_id_fkey TO articles_food_category_id_fkey;

-- Update foreign keys in related tables
ALTER TABLE recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_ingredient_id_fkey;
ALTER TABLE recipe_ingredients ADD CONSTRAINT recipe_ingredients_article_id_fkey 
  FOREIGN KEY (article_id) REFERENCES articles(id);

ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS purchase_items_ingredient_id_fkey;
ALTER TABLE purchase_items ADD CONSTRAINT purchase_items_article_id_fkey 
  FOREIGN KEY (article_id) REFERENCES articles(id);

ALTER TABLE article_allergens DROP CONSTRAINT IF EXISTS ingredient_allergens_ingredient_id_fkey;
ALTER TABLE article_allergens ADD CONSTRAINT article_allergens_article_id_fkey 
  FOREIGN KEY (article_id) REFERENCES articles(id);

-- Step 5: Rename indexes
ALTER INDEX idx_ingredients_supplier RENAME TO idx_articles_supplier;
ALTER INDEX idx_ingredients_unit_id RENAME TO idx_articles_unit_id;
ALTER INDEX idx_ingredients_default_unit_id RENAME TO idx_articles_default_unit_id;
ALTER INDEX idx_ingredients_food_category RENAME TO idx_articles_food_category;
ALTER INDEX idx_ingredients_sku RENAME TO idx_articles_sku;
ALTER INDEX idx_recipe_ingredients_ingredient RENAME TO idx_recipe_ingredients_article;
ALTER INDEX idx_ingredient_allergens_ingredient RENAME TO idx_article_allergens_article;

-- Step 6: Rename triggers
DROP TRIGGER IF EXISTS update_ingredients_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Create index for image_url
CREATE INDEX idx_articles_image_url ON articles(image_url) WHERE image_url IS NOT NULL;

-- Step 8: Add comment to document the image field constraint
COMMENT ON COLUMN articles.image_url IS 'Optional image URL for the article. Limited to 1 image per article.';

-- Step 9: Update RLS policies if they exist (add them if needed in the future)
-- Note: If you have Row Level Security policies, they would need to be updated here

