-- Add priority column to todo_items table
ALTER TABLE todo_items ADD COLUMN priority VARCHAR DEFAULT 'none';

-- Create index for faster priority filtering/sorting
CREATE INDEX idx_todo_items_priority ON todo_items(priority);
