-- Script para adicionar colunas faltantes na tabela company_profiles
-- Executar este script no Supabase SQL Editor

-- Adicionar coluna website se não existir
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS website text;

-- Adicionar coluna address se não existir  
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS address text;

-- Adicionar coluna responsible_cpf se não existir (usado no PerfilTab)
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS responsible_cpf text;

-- Verificar as colunas da tabela após as alterações
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'company_profiles' 
AND table_schema = 'public' 
ORDER BY ordinal_position;