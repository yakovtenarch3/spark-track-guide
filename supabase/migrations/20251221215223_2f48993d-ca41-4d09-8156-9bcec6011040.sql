-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create alarms table
CREATE TABLE public.alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'שעון מעורר',
  time TIME NOT NULL DEFAULT '06:00:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  snooze_enabled BOOLEAN NOT NULL DEFAULT true,
  snooze_minutes INTEGER NOT NULL DEFAULT 5,
  ringtone_url TEXT,
  ringtone_name TEXT DEFAULT 'ברירת מחדל',
  days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth in this app)
CREATE POLICY "Allow all on alarms" 
ON public.alarms 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_alarms_updated_at
BEFORE UPDATE ON public.alarms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for ringtones
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ringtones', 'ringtones', true);

-- Storage policies for ringtones bucket
CREATE POLICY "Ringtones are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ringtones');

CREATE POLICY "Anyone can upload ringtones" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ringtones');

CREATE POLICY "Anyone can delete ringtones" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ringtones');