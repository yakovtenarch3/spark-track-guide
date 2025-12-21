-- Add is_favorite column to custom_quotes table
ALTER TABLE public.custom_quotes
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;