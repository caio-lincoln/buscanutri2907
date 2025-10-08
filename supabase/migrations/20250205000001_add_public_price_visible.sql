-- Adicionar coluna public_price_visible à tabela nutritionist_profiles
-- Esta coluna controla se o preço de consulta deve ser exibido publicamente

ALTER TABLE public.nutritionist_profiles 
ADD COLUMN IF NOT EXISTS public_price_visible BOOLEAN DEFAULT true;

-- Documentar a coluna
COMMENT ON COLUMN public.nutritionist_profiles.public_price_visible IS 'Define se o preço de consulta é visível publicamente';

-- Atualizar a data de modificação para registros existentes
UPDATE public.nutritionist_profiles 
SET updated_at = NOW()
WHERE public_price_visible IS NULL;