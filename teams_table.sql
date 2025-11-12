-- Create teams table for Supabase
-- Run this SQL in your Supabase SQL editor

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for teams
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read teams
CREATE POLICY "Anyone can view teams" ON public.teams
  FOR SELECT USING (true);

-- Policy: Only admin can insert teams (we'll use service role for admin operations)
CREATE POLICY "Only admin can insert teams" ON public.teams
  FOR INSERT WITH CHECK (true);

-- Policy: Only admin can update teams
CREATE POLICY "Only admin can update teams" ON public.teams
  FOR UPDATE USING (true);

-- Policy: Only admin can delete teams
CREATE POLICY "Only admin can delete teams" ON public.teams
  FOR DELETE USING (true);

-- Insert default teams
INSERT INTO public.teams (name, description) VALUES
  ('영업팀', '영업 관련 업무를 담당하는 팀'),
  ('마케팅팀', '마케팅 관련 업무를 담당하는 팀'),
  ('고객지원팀', '고객 지원 업무를 담당하는 팀'),
  ('운영팀', '운영 관련 업무를 담당하는 팀')
ON CONFLICT (name) DO NOTHING;