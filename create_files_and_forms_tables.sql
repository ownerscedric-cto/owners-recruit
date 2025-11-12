-- Create downloadable_files and form_fields tables for admin management
-- Run this SQL in your Supabase SQL editor

-- Create downloadable_files table
CREATE TABLE IF NOT EXISTS public.downloadable_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type VARCHAR(100) DEFAULT 'application/octet-stream',
  category VARCHAR(100) DEFAULT 'general',
  active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_fields table
CREATE TABLE IF NOT EXISTS public.form_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name VARCHAR(100) NOT NULL UNIQUE,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'select', 'multiselect', 'radio', 'checkbox', 'textarea', 'date')),
  label VARCHAR(255) NOT NULL,
  placeholder TEXT,
  description TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  options JSONB, -- JSON for select/radio options
  validation_rules JSONB, -- JSON for validation rules
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_downloadable_files_updated_at BEFORE UPDATE ON public.downloadable_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON public.form_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for downloadable_files
ALTER TABLE public.downloadable_files ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active files
CREATE POLICY "Anyone can view active downloadable files" ON public.downloadable_files
  FOR SELECT USING (active = true);

-- Policy: Only admin can manage files (we'll use service role)
CREATE POLICY "Only admin can manage downloadable files" ON public.downloadable_files
  FOR ALL USING (true);

-- Add RLS policies for form_fields
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read form fields
CREATE POLICY "Anyone can view form fields" ON public.form_fields
  FOR SELECT USING (true);

-- Policy: Only admin can manage form fields
CREATE POLICY "Only admin can manage form fields" ON public.form_fields
  FOR ALL USING (true);

-- Insert default form fields (based on current applicant form)
INSERT INTO public.form_fields (field_name, field_type, label, placeholder, required, visible, display_order) VALUES
  ('name', 'text', '이름', '이름을 입력해주세요', true, true, 1),
  ('email', 'email', '이메일', '이메일을 입력해주세요', true, true, 2),
  ('phone', 'phone', '전화번호', '전화번호를 입력해주세요', true, true, 3),
  ('address', 'textarea', '주소', '주소를 입력해주세요', true, true, 4),
  ('birth_date', 'date', '생년월일', '', true, true, 5),
  ('resident_number', 'text', '주민등록번호', '뒤 7자리를 입력해주세요 (예: 1234567)', false, true, 6),
  ('bank_name', 'select', '은행명', '은행을 선택해주세요', false, true, 7),
  ('bank_account', 'text', '계좌번호', '계좌번호를 입력해주세요 (- 제외)', false, true, 8),
  ('life_insurance_pass_date', 'date', '생명보험시험 합격일', '', false, true, 9),
  ('life_education_date', 'date', '생명보험교육 수강일', '', false, true, 10),
  ('final_school', 'text', '최종학력', '최종학력을 입력해주세요', false, true, 11),
  ('applicant_type', 'select', '지원유형', '지원유형을 선택해주세요', true, true, 12),
  ('recruiter_name', 'select', '도입자(모집자)명', '모집자를 선택해주세요', true, true, 13)
ON CONFLICT (field_name) DO NOTHING;

-- Insert sample downloadable file (위촉/해촉 안내서)
INSERT INTO public.downloadable_files (title, description, file_name, file_path, category) VALUES
  ('위촉/해촉 안내서', '보험설계사 위촉 및 해촉 절차에 대한 상세 안내서입니다.', 'appointment_guide.pdf', '/uploads/guides/appointment_guide.pdf', 'guide')
ON CONFLICT DO NOTHING;