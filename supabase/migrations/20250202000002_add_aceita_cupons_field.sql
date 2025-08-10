-- Migration: Add aceita_cupons field to nutritionist_profiles table
-- This field will track nutritionist consent for discount coupon campaigns

-- Add aceita_cupons column
ALTER TABLE public.nutritionist_profiles 
ADD COLUMN IF NOT EXISTS aceita_cupons BOOLEAN DEFAULT false NOT NULL;

-- Add comment to document the field purpose
COMMENT ON COLUMN public.nutritionist_profiles.aceita_cupons IS 'Indica se o nutricionista aceita participar de campanhas com cupons de desconto';

-- Create index for better query performance when filtering by aceita_cupons
CREATE INDEX IF NOT EXISTS idx_nutritionist_profiles_aceita_cupons ON public.nutritionist_profiles(aceita_cupons);