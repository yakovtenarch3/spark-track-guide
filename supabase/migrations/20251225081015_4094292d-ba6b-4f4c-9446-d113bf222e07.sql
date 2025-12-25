-- Create user preferences table for storing theme and other settings
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preference_key text NOT NULL UNIQUE,
  preference_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow all operations (public app without auth)
CREATE POLICY "Allow all on user_preferences" 
ON public.user_preferences 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();