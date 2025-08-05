-- Script para adicionar a coluna cancellation_policy à tabela nutritionist_profiles
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adicionar coluna cancellation_policy à tabela nutritionist_profiles
ALTER TABLE public.nutritionist_profiles 
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.nutritionist_profiles.cancellation_policy IS 'Política de cancelamento de consultas definida pelo nutricionista';

-- Verificar se a coluna foi adicionada com sucesso
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'nutritionist_profiles' 
AND column_name = 'cancellation_policy';