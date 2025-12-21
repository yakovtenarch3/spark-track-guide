-- Add reminder fields to daily_goals table
ALTER TABLE public.daily_goals 
ADD COLUMN reminder_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN reminder_time TIME WITHOUT TIME ZONE;