-- Add transform_version column to track which transform model a frame uses
ALTER TABLE cosmetic_frames 
ADD COLUMN IF NOT EXISTS transform_version integer DEFAULT 2;

-- Migrate existing frames: convert pixel-based offsets to percentage-based
-- Assumes old offsets were calibrated for a 96px container
UPDATE cosmetic_frames 
SET 
  frame_offset_x = ROUND((COALESCE(frame_offset_x, 0) / 96.0) * 100, 2),
  frame_offset_y = ROUND((COALESCE(frame_offset_y, 0) / 96.0) * 100, 2),
  transform_version = 2
WHERE transform_version IS NULL OR transform_version < 2;