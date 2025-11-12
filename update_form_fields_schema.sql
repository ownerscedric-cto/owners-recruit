-- Migration to update form_fields schema if it exists with old column names
-- Run this in Supabase SQL editor if you already have a form_fields table

-- Check if table exists and update schema
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_fields') THEN

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_fields' AND column_name = 'description') THEN
      ALTER TABLE public.form_fields ADD COLUMN description TEXT;
    END IF;

    -- Rename order_index to display_order if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_fields' AND column_name = 'order_index') THEN
      ALTER TABLE public.form_fields RENAME COLUMN order_index TO display_order;
    END IF;

    -- Add display_order if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_fields' AND column_name = 'display_order') THEN
      ALTER TABLE public.form_fields ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- Update options column to JSONB if it's TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_fields' AND column_name = 'options' AND data_type = 'text') THEN
      ALTER TABLE public.form_fields ALTER COLUMN options TYPE JSONB USING options::JSONB;
    END IF;

    -- Update validation_rules column to JSONB if it's TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_fields' AND column_name = 'validation_rules' AND data_type = 'text') THEN
      ALTER TABLE public.form_fields ALTER COLUMN validation_rules TYPE JSONB USING validation_rules::JSONB;
    END IF;

    -- Update field_type constraint to include new types
    ALTER TABLE public.form_fields DROP CONSTRAINT IF EXISTS form_fields_field_type_check;
    ALTER TABLE public.form_fields ADD CONSTRAINT form_fields_field_type_check
      CHECK (field_type IN ('text', 'email', 'phone', 'select', 'multiselect', 'radio', 'checkbox', 'textarea', 'date'));

    RAISE NOTICE 'form_fields table schema updated successfully';
  ELSE
    RAISE NOTICE 'form_fields table does not exist, please run the main create_files_and_forms_tables.sql first';
  END IF;
END $$;