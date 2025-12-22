-- Create storage bucket for user books/PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the books bucket
CREATE POLICY "Anyone can view books"
ON storage.objects FOR SELECT
USING (bucket_id = 'books');

CREATE POLICY "Anyone can upload books"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'books');

CREATE POLICY "Anyone can update books"
ON storage.objects FOR UPDATE
USING (bucket_id = 'books');

CREATE POLICY "Anyone can delete books"
ON storage.objects FOR DELETE
USING (bucket_id = 'books');

-- Create table for user uploaded books
CREATE TABLE public.user_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  current_page INTEGER DEFAULT 1,
  total_pages INTEGER,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (single user app)
CREATE POLICY "Allow all operations on user_books"
ON public.user_books
FOR ALL
USING (true)
WITH CHECK (true);