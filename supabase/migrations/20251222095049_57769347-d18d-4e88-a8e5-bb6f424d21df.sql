-- Create book_progress table for tracking reading position
CREATE TABLE public.book_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL DEFAULT 'procrastination-book',
  current_chapter INTEGER DEFAULT 1,
  current_tip INTEGER DEFAULT 1,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create book_notes table for user notes
CREATE TABLE public.book_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL DEFAULT 'procrastination-book',
  chapter INTEGER,
  tip_id INTEGER,
  note_text TEXT NOT NULL,
  note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'question', 'insight', 'ai_analysis')),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create book_bookmarks table for saving positions
CREATE TABLE public.book_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL DEFAULT 'procrastination-book',
  tip_id INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.book_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this app)
CREATE POLICY "Allow all operations on book_progress" ON public.book_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on book_notes" ON public.book_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on book_bookmarks" ON public.book_bookmarks FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_book_notes_updated_at
  BEFORE UPDATE ON public.book_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();