-- Add birth_date column to suppliers table
ALTER TABLE suppliers ADD COLUMN birth_date DATE;

-- Add comment to explain the column
COMMENT ON COLUMN suppliers.birth_date IS 'Birth date of the supplier contact person';
