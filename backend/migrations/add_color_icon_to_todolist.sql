-- Add color and icon columns to todo_lists table
ALTER TABLE todo_lists 
ADD COLUMN IF NOT EXISTS color VARCHAR DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS icon VARCHAR DEFAULT '📋';

-- Update existing records to have default values
UPDATE todo_lists 
SET color = '#3b82f6' 
WHERE color IS NULL;

UPDATE todo_lists 
SET icon = '📋' 
WHERE icon IS NULL;
