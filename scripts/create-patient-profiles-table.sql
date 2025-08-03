-- Script para criar/verificar a tabela patient_profiles
-- Execute este script ANTES do fix-patient-profiles-rls.sql

BEGIN;

-- 1. Criar a tabela patient_profiles se ela não existir
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    birth_date DATE,
    cpf VARCHAR(14),
    rg VARCHAR(20),
    profile_image_url TEXT,
    health_conditions TEXT[],
    allergies TEXT[],
    dietary_preferences TEXT[],
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 2. Verificar e adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'user_id') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- full_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN full_name VARCHAR(255);
    END IF;
    
    -- email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'email') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN email VARCHAR(255);
    END IF;
    
    -- phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- birth_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'birth_date') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN birth_date DATE;
    END IF;
    
    -- cpf
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'cpf') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN cpf VARCHAR(14);
    END IF;
    
    -- rg
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'rg') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN rg VARCHAR(20);
    END IF;
    
    -- profile_image_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'profile_image_url') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN profile_image_url TEXT;
    END IF;
    
    -- health_conditions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'health_conditions') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN health_conditions TEXT[];
    END IF;
    
    -- allergies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'allergies') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN allergies TEXT[];
    END IF;
    
    -- dietary_preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'dietary_preferences') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN dietary_preferences TEXT[];
    END IF;
    
    -- emergency_contact_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN emergency_contact_name VARCHAR(255);
    END IF;
    
    -- emergency_contact_phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN emergency_contact_phone VARCHAR(20);
    END IF;
    
    -- emergency_contact_relationship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'emergency_contact_relationship') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN emergency_contact_relationship VARCHAR(100);
    END IF;
    
    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- 3. Garantir que existe uma constraint UNIQUE no user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'patient_profiles' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%user_id%'
    ) THEN
        ALTER TABLE public.patient_profiles ADD CONSTRAINT patient_profiles_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON public.patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_email ON public.patient_profiles(email);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_cpf ON public.patient_profiles(cpf);

-- 5. Criar a view public.users se não existir (para compatibilidade)
CREATE OR REPLACE VIEW public.users AS 
SELECT 
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users;

-- 6. Dar permissões na view
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- 7. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_patient_profiles_updated_at ON public.patient_profiles;
CREATE TRIGGER update_patient_profiles_updated_at
    BEFORE UPDATE ON public.patient_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- 9. Verificar a estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patient_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;