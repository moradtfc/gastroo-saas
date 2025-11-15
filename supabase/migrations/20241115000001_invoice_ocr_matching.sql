-- Create table for storing OCR results from invoices
CREATE TABLE invoice_ocr_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    raw_text TEXT,
    parsed_items JSONB, -- Array of {name, quantity, unit, price}
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for storing learned product mappings
-- This helps improve suggestions over time
CREATE TABLE product_mappings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ocr_text VARCHAR(255) NOT NULL, -- The text as it appears in OCR
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0
    times_used INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ocr_text, ingredient_id)
);

-- Create index for faster lookups
CREATE INDEX idx_product_mappings_ocr_text ON product_mappings(ocr_text);
CREATE INDEX idx_product_mappings_ingredient ON product_mappings(ingredient_id);
CREATE INDEX idx_invoice_ocr_purchase ON invoice_ocr_results(purchase_id);

-- Add trigger for updated_at
CREATE TRIGGER update_invoice_ocr_results_updated_at BEFORE UPDATE ON invoice_ocr_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_mappings_updated_at BEFORE UPDATE ON product_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment mapping usage
CREATE OR REPLACE FUNCTION increment_mapping_usage(mapping_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE product_mappings
    SET times_used = times_used + 1,
        last_used_at = NOW()
    WHERE id = mapping_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create product mapping
CREATE OR REPLACE FUNCTION upsert_product_mapping(
    p_ocr_text VARCHAR(255),
    p_ingredient_id UUID,
    p_confidence_score DECIMAL(3,2) DEFAULT 1.0
)
RETURNS UUID AS $$
DECLARE
    mapping_id UUID;
BEGIN
    -- Try to find existing mapping
    SELECT id INTO mapping_id
    FROM product_mappings
    WHERE ocr_text = p_ocr_text AND ingredient_id = p_ingredient_id;

    IF mapping_id IS NULL THEN
        -- Create new mapping
        INSERT INTO product_mappings (ocr_text, ingredient_id, confidence_score)
        VALUES (p_ocr_text, p_ingredient_id, p_confidence_score)
        RETURNING id INTO mapping_id;
    ELSE
        -- Update existing mapping
        UPDATE product_mappings
        SET times_used = times_used + 1,
            last_used_at = NOW(),
            confidence_score = GREATEST(confidence_score, p_confidence_score)
        WHERE id = mapping_id;
    END IF;

    RETURN mapping_id;
END;
$$ LANGUAGE plpgsql;
