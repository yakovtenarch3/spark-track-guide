-- Add target_value field to daily_goals for measurable targets
ALTER TABLE public.daily_goals 
ADD COLUMN target_value text DEFAULT NULL,
ADD COLUMN target_unit text DEFAULT NULL;

-- Add actual_value field to daily_goal_logs for recording actual results
ALTER TABLE public.daily_goal_logs 
ADD COLUMN actual_value text DEFAULT NULL;