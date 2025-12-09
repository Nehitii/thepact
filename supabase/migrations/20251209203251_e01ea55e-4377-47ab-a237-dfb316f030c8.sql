-- Add new goal_type enum values
ALTER TYPE goal_type ADD VALUE IF NOT EXISTS 'relationship';
ALTER TYPE goal_type ADD VALUE IF NOT EXISTS 'diy';