-- Migration: Remove problematic image_url index from articles table
-- Date: 2024-10-20
-- Description: Remove the image_url index that limits the size of base64 images
--              The index was causing "index row requires X bytes, maximum size is 8191" errors

-- Drop the problematic index on image_url
DROP INDEX IF EXISTS idx_articles_image_url;

-- Add comment explaining why the index was removed
COMMENT ON COLUMN articles.image_url IS 'Optional image URL for the article. Limited to 1 image per article. No index due to base64 size limitations.';
