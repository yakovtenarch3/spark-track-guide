-- Create timer_topics table for storing available topics
CREATE TABLE public.timer_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  icon TEXT NOT NULL DEFAULT 'clock',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timer_sessions table for storing completed timer sessions
CREATE TABLE public.timer_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.timer_topics(id) ON DELETE SET NULL,
  topic_name TEXT NOT NULL,
  title TEXT,
  notes TEXT,
  duration_seconds INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timer_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth in this project)
CREATE POLICY "Allow all on timer_topics" ON public.timer_topics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on timer_sessions" ON public.timer_sessions FOR ALL USING (true) WITH CHECK (true);

-- Insert some default topics
INSERT INTO public.timer_topics (name, color, icon) VALUES
  ('עבודה', '#3B82F6', 'briefcase'),
  ('לימודים', '#10B981', 'book'),
  ('תרגול', '#F59E0B', 'dumbbell'),
  ('קריאה', '#8B5CF6', 'book-open'),
  ('מדיטציה', '#EC4899', 'heart'),
  ('פרויקט אישי', '#6366F1', 'rocket');