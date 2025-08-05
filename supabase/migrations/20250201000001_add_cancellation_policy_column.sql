-- Adicionar coluna cancellation_policy à tabela nutritionist_profiles
-- Esta coluna armazena a política de cancelamento de consultas do nutricionista

ALTER TABLE public.nutritionist_profiles 
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.nutritionist_profiles.cancellation_policy IS 'Política de cancelamento de consultas definida pelo nutricionista';