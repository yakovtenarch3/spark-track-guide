-- Add highlight_rects column to store position data for visual highlighting
ALTER TABLE public.pdf_annotations 
ADD COLUMN highlight_rects jsonb DEFAULT NULL;

-- Add comment column for user notes on highlights  
ALTER TABLE public.pdf_annotations 
ADD COLUMN comment text DEFAULT NULL;

-- Add highlight_type column to distinguish text vs area highlights
ALTER TABLE public.pdf_annotations 
ADD COLUMN highlight_type text DEFAULT 'text';

-- Create index for faster page lookups
CREATE INDEX IF NOT EXISTS idx_pdf_annotations_book_page 
ON public.pdf_annotations(book_id, page_number);