-- Add date columns to todo_items table
ALTER TABLE todo_items ADD COLUMN due_date DATETIME NULL;
ALTER TABLE todo_items ADD COLUMN reminder_date DATETIME NULL;

-- Create indexes for faster date filtering
CREATE INDEX idx_todo_items_due_date ON todo_items(due_date);
CREATE INDEX idx_todo_items_reminder_date ON todo_items(reminder_date);
