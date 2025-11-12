-- Add form_type column to distinguish between new and experienced applicant forms
-- Run this after applying the main schema

DO $$
BEGIN
  -- Add form_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_fields' AND column_name = 'form_type') THEN
    ALTER TABLE public.form_fields ADD COLUMN form_type VARCHAR(20) NOT NULL DEFAULT 'common';

    -- Update the constraint to include form_type
    ALTER TABLE public.form_fields DROP CONSTRAINT IF EXISTS form_fields_form_type_check;
    ALTER TABLE public.form_fields ADD CONSTRAINT form_fields_form_type_check
      CHECK (form_type IN ('common', 'new', 'experienced'));

    -- Make field_name unique per form_type instead of globally unique
    ALTER TABLE public.form_fields DROP CONSTRAINT IF EXISTS form_fields_field_name_key;
    ALTER TABLE public.form_fields ADD CONSTRAINT form_fields_field_name_form_type_unique
      UNIQUE (field_name, form_type);

    RAISE NOTICE 'form_type column added successfully';
  ELSE
    RAISE NOTICE 'form_type column already exists';
  END IF;

  -- Update existing records to 'common' if they are null or default
  UPDATE public.form_fields SET form_type = 'common' WHERE form_type IS NULL OR form_type = '';

END $$;

-- Insert some example fields for new applicants
INSERT INTO public.form_fields (field_name, field_type, label, placeholder, required, visible, display_order, form_type, description) VALUES
  ('graduation_certificate', 'text', '졸업증명서', '졸업증명서 정보를 입력해주세요', true, true, 20, 'new', '신입자만 제출하는 졸업증명서입니다.'),
  ('insurance_education_new', 'date', '보험연수원 신규교육 이수일', '신규교육 이수일을 선택해주세요', true, true, 21, 'new', '신입자 전용 보험연수원 교육 이수일입니다.')
ON CONFLICT (field_name, form_type) DO NOTHING;

-- Insert some example fields for experienced applicants
INSERT INTO public.form_fields (field_name, field_type, label, placeholder, required, visible, display_order, form_type, description) VALUES
  ('career_certificate', 'text', '경력증명서', '이전 보험회사 경력증명서 정보를 입력해주세요', true, true, 20, 'experienced', '경력자만 제출하는 경력증명서입니다.'),
  ('resignation_certificate', 'text', '말소증명서', '기존 보험사 등록 말소 증명서 정보를 입력해주세요', true, true, 21, 'experienced', '기존 보험사 등록을 말소한 증명서입니다.'),
  ('insurance_education_exp', 'date', '보험연수원 경력교육 이수일', '경력교육 이수일을 선택해주세요', true, true, 22, 'experienced', '경력자 전용 보험연수원 교육 이수일입니다.')
ON CONFLICT (field_name, form_type) DO NOTHING;