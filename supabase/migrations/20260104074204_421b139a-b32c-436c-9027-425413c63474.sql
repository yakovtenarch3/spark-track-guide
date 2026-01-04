-- Create timer_goals table for tracking goals per topic
CREATE TABLE public.timer_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.timer_topics(id) ON DELETE CASCADE,
  daily_target_minutes INTEGER NOT NULL DEFAULT 60,
  weekly_target_minutes INTEGER NOT NULL DEFAULT 420,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_time TIME WITHOUT TIME ZONE,
  reminder_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}'::integer[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.timer_goals ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this app doesn't use auth)
CREATE POLICY "Allow all on timer_goals" 
ON public.timer_goals 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_timer_goals_updated_at
BEFORE UPDATE ON public.timer_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();