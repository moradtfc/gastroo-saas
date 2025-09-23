-- Migration: Link expenses with purchases
-- Date: 2024-09-22
-- Description: Add purchase_id column to expenses table to link expenses with purchases

-- Add purchase_id column to expenses table
ALTER TABLE expenses 
ADD COLUMN purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_expenses_purchase_id ON expenses(purchase_id);

-- Update existing expenses to link with purchases if possible
-- This is a placeholder - in a real scenario you'd need to match based on amount and date
-- For now, we'll leave existing expenses unlinked (purchase_id = NULL)

-- Add a trigger to automatically create expense when a purchase is created
CREATE OR REPLACE FUNCTION create_expense_for_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- Create an expense record for the purchase
    INSERT INTO expenses (
        description,
        amount,
        category,
        expense_date,
        purchase_id,
        notes
    ) VALUES (
        CONCAT('Compra de ingredientes - ', COALESCE(
            (SELECT name FROM suppliers WHERE id = NEW.supplier_id), 
            'Proveedor no especificado'
        )),
        NEW.total_amount,
        'Compras',
        NEW.purchase_date,
        NEW.id,
        CONCAT('Gasto generado automáticamente por compra ID: ', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after purchase insert
CREATE TRIGGER trigger_create_expense_for_purchase
    AFTER INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION create_expense_for_purchase();

-- Note: This trigger will only apply to new purchases created after this migration
-- Existing purchases won't have associated expenses unless manually created
