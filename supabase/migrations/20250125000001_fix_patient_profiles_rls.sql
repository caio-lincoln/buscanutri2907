-- Migração para corrigir problemas de RLS na tabela patient_profiles
-- Data: 2025-01-25
-- Descrição: Resolve erro "new row violates row-level security policy for table patient_profiles"

-- 1. Criar a tabela patient_profiles se não existir
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

-- 2. Habilitar RLS
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Users can view their own patient profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can update their own patient profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can insert their own patient profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can manage own profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can create patient profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Authenticated users can create patient profiles" ON public.patient_profiles;

-- 4. Criar políticas RLS corretas

-- Política para SELECT: usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own patient profile" ON public.patient_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: usuários autenticados podem criar seu próprio perfil
CREATE POLICY "Users can create their own patient profile" ON public.patient_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update their own patient profile" ON public.patient_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar seu próprio perfil
CREATE POLICY "Users can delete their own patient profile" ON public.patient_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Nutricionistas podem ver perfis de pacientes durante consultas ativas
CREATE POLICY "Nutritionists can view patient profiles during consultations" ON public.patient_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.consultations 
            WHERE consultations.patient_id = patient_profiles.user_id 
            AND consultations.nutritionist_id = auth.uid()
            AND consultations.status IN ('scheduled', 'in-progress', 'completed')
        )
    );

-- 5. Criar view public.users para compatibilidade
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

-- Dar permissões na view
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON public.patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_email ON public.patient_profiles(email);

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