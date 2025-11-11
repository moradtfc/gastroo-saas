-- Migration: Create supplier groups system
-- Date: 2024-11-20
-- Description: Add groups table and many-to-many relationship with suppliers

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supplier_groups junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS supplier_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id, group_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supplier_groups_supplier ON supplier_groups(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_groups_group ON supplier_groups(group_id);

-- Create trigger for updated_at on groups
CREATE TRIGGER update_groups_updated_at 
    BEFORE UPDATE ON groups
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

