-- Migration: Add missing columns to nutritionist_profiles table
-- This resolves PGRST204 errors for cancellation_policy, default_consultation_duration, and identity_document_url

-- Add cancellation_policy column
ALTER TABLE public.nutritionist_profiles 
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- Add default_consultation_duration column  
ALTER TABLE public.nutritionist_profiles 
ADD COLUMN IF NOT EXISTS default_consultation_duration INTEGER;

-- Add identity_document_url column
ALTER TABLE public.nutritionist_profiles 
ADD COLUMN IF NOT EXISTS identity_document_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.nutritionist_profiles.cancellation_policy IS 'Política de cancelamento de consultas do nutricionista';
COMMENT ON COLUMN public.nutritionist_profiles.default_consultation_duration IS 'Duração padrão das consultas em minutos';
COMMENT ON COLUMN public.nutritionist_profiles.identity_document_url IS 'URL do documento de identidade (RG, CNH, etc.)';

-- Verify the columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'nutritionist_profiles' 
        AND column_name = 'cancellation_policy'
    ) THEN
        RAISE NOTICE 'Column cancellation_policy added successfully';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'nutritionist_profiles' 
        AND column_name = 'default_consultation_duration'
    ) THEN
        RAISE NOTICE 'Column default_consultation_duration added successfully';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'nutritionist_profiles' 
        AND column_name = 'identity_document_url'
    ) THEN
        RAISE NOTICE 'Column identity_document_url added successfully';
    END IF;
END $$;