-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_frequency INTEGER NOT NULL DEFAULT 3,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '07:00:00',
  notify_on_missed_login BOOLEAN NOT NULL DEFAULT true,
  notify_on_streak_break BOOLEAN NOT NULL DEFAULT true,
  notify_on_low_engagement BOOLEAN NOT NULL DEFAULT true,
  notify_on_milestones BOOLEAN NOT NULL DEFAULT true,
  custom_triggers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification logs table to track sent notifications
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all on notification_preferences" 
ON public.notification_preferences 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all on notification_logs" 
ON public.notification_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();