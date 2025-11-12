-- Add active column to recruiters table
-- Run this SQL in your Supabase SQL editor after creating the teams table

ALTER TABLE public.recruiters
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Update existing recruiters to be active by default
UPDATE public.recruiters
SET active = true
WHERE active IS NULL;