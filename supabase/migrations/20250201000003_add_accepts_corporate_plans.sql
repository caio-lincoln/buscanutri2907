-- Adicionar campo accepts_corporate_plans à tabela nutritionist_profiles

-- Adicionar o campo se não existir
ALTER TABLE public.nutritionist_profiles 
ADD COLUMN IF NOT EXISTS accepts_corporate_plans BOOLEAN DEFAULT false;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.nutritionist_profiles.accepts_corporate_plans IS 'Indica se o nutricionista aceita atender em planos corporativos';

-- Atualizar a data de modificação para registros existentes
UPDATE public.nutritionist_profiles 
SET updated_at = NOW() 
WHERE accepts_corporate_plans IS NULL;