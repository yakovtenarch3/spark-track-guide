-- Create daily_goals table for trackable daily goals
CREATE TABLE public.daily_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  icon TEXT NOT NULL DEFAULT 'target',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_goal_logs table for tracking each day
CREATE TABLE public.daily_goal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.daily_goals(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  succeeded BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(goal_id, log_date)
);

-- Enable RLS
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goal_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all on daily_goals" ON public.daily_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_goal_logs" ON public.daily_goal_logs FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_daily_goal_logs_goal_date ON public.daily_goal_logs(goal_id, log_date);