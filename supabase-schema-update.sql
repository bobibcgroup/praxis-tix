-- Update outfit_history table to include style data
-- Run this in your Supabase SQL Editor

-- Add new columns if they don't exist
ALTER TABLE outfit_history 
ADD COLUMN IF NOT EXISTS style_name TEXT,
ADD COLUMN IF NOT EXISTS style_dna JSONB,
ADD COLUMN IF NOT EXISTS color_palette JSONB;

-- Add comments for documentation
COMMENT ON COLUMN outfit_history.style_name IS 'User-provided name for this style';
COMMENT ON COLUMN outfit_history.style_dna IS 'Style DNA data (primaryStyle, secondaryStyle)';
COMMENT ON COLUMN outfit_history.color_palette IS 'Array of color swatches with name and hex';
