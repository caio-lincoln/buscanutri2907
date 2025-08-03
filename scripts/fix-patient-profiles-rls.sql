-- Script para corrigir políticas RLS da tabela patient_profiles
-- Este script resolve o erro: "new row violates row-level security policy for table patient_profiles"

BEGIN;

-- 1. Verificar se RLS está habilitado na tabela patient_profiles
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Users can view their own patient profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can update their own patient profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can insert their own patient profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can manage own profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can create patient profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Authenticated users can create patient profiles" ON public.patient_profiles;

-- 3. Criar políticas mais permissivas para patient_profiles

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

-- 4. Políticas adicionais para permitir acesso durante consultas

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

-- Admins podem ver todos os perfis de pacientes
CREATE POLICY "Admins can view all patient profiles" ON public.patient_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- 5. Verificar se a tabela users existe e tem as políticas necessárias
-- Isso é importante porque a função ensurePatientProfile busca dados da tabela users

-- Verificar se existe uma tabela users no schema public
DO $$
BEGIN
    -- Se a tabela users não existir no schema public, criar uma view ou política alternativa
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Criar uma view da tabela auth.users para facilitar o acesso
        CREATE OR REPLACE VIEW public.users AS 
        SELECT 
            id,
            email,
            created_at,
            updated_at,
            email_confirmed_at,
            phone,
            phone_confirmed_at
        FROM auth.users;
        
        -- Dar permissões na view
        GRANT SELECT ON public.users TO authenticated;
        GRANT SELECT ON public.users TO anon;
    END IF;
END $$;

-- 6. Garantir que a tabela patient_profiles tenha a estrutura correta
-- Verificar se as colunas necessárias existem
DO $$
BEGIN
    -- Adicionar coluna user_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'user_id') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Adicionar coluna full_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN full_name VARCHAR(255);
    END IF;
    
    -- Adicionar colunas de timestamp se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.patient_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON public.patient_profiles(user_id);

-- 8. Garantir que a função de trigger para updated_at existe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_patient_profiles_updated_at ON public.patient_profiles;
CREATE TRIGGER update_patient_profiles_updated_at
    BEFORE UPDATE ON public.patient_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- 10. Verificar se as políticas foram aplicadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'patient_profiles'
ORDER BY policyname;

-- 11. Testar se um usuário pode criar um perfil (exemplo)
-- Este é apenas um exemplo de como testar - não execute em produção sem dados reais
/*
-- Exemplo de teste (descomente apenas para teste):
INSERT INTO public.patient_profiles (user_id, full_name, created_at, updated_at)
VALUES (auth.uid(), 'Teste Usuario', NOW(), NOW());
*/