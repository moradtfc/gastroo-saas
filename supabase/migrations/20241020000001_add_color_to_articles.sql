-- Migration: Add color field to articles table
-- Date: 2024-10-20
-- Description: Add color field to articles table for background color selection
--              This allows articles to have a background color similar to recipes

-- Add color column to articles table
ALTER TABLE articles 
ADD COLUMN color VARCHAR(7) DEFAULT '#FF9D3D'; -- Hex color code with default orange

-- Add comment to document the color field
COMMENT ON COLUMN articles.color IS 'Background color for the article card (hex color code). Default: #FF9D3D (orange)';

-- Create index for color field for better performance in queries
CREATE INDEX idx_articles_color ON articles(color) WHERE color IS NOT NULL;
