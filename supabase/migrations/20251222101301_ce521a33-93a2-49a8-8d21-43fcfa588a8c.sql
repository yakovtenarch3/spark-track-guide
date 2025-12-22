-- Create table for PDF page annotations/notes
CREATE TABLE public.pdf_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.user_books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  highlight_text TEXT,
  position_x NUMERIC,
  position_y NUMERIC,
  color TEXT DEFAULT '#FFEB3B',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_annotations ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (single user app)
CREATE POLICY "Allow all operations on pdf_annotations"
ON public.pdf_annotations
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_pdf_annotations_book_page ON public.pdf_annotations(book_id, page_number);