-- Add reading progress columns to user_books table
ALTER TABLE user_books 
ADD COLUMN IF NOT EXISTS current_page INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_books_last_read ON user_books(last_read_at DESC);

-- Comment on columns
COMMENT ON COLUMN user_books.current_page IS 'Current page the user is reading';
COMMENT ON COLUMN user_books.last_read_at IS 'Last time the user read this book';
