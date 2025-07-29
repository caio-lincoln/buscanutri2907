-- Script completo para corrigir todas as políticas RLS
-- Este script resolve os erros de permissão que estão aparecendo no console

BEGIN;

-- 1. Habilitar RLS em todas as tabelas necessárias
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_favorite_nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritionist_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Limpar todas as políticas existentes para evitar conflitos

-- auth.users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON auth.users;
DROP POLICY IF EXISTS "Nutritionists can view patient data during consultations" ON auth.users;

-- consultations policies
DROP POLICY IF EXISTS "Pacientes podem ver suas próprias consultas" ON consultations;
DROP POLICY IF EXISTS "Nutricionistas podem ver suas próprias consultas" ON consultations;
DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
DROP POLICY IF EXISTS "Pacientes podem criar consultas" ON consultations;
DROP POLICY IF EXISTS "Nutritionists can insert consultations" ON consultations;
DROP POLICY IF EXISTS "Users can update their own consultations" ON consultations;
DROP POLICY IF EXISTS "Nutricionistas podem atualizar suas consultas" ON consultations;
DROP POLICY IF EXISTS "Pacientes podem cancelar suas consultas" ON consultations;
DROP POLICY IF EXISTS "Admins podem ver tudo" ON consultations;

-- consultation_messages policies
DROP POLICY IF EXISTS "Participantes podem ver mensagens da consulta" ON consultation_messages;
DROP POLICY IF EXISTS "Users can view messages from their consultations" ON consultation_messages;
DROP POLICY IF EXISTS "Participantes podem enviar mensagens" ON consultation_messages;
DROP POLICY IF EXISTS "Users can insert messages in their consultations" ON consultation_messages;
DROP POLICY IF EXISTS "Remetentes podem atualizar suas mensagens" ON consultation_messages;
DROP POLICY IF EXISTS "Admins podem ver todas as mensagens" ON consultation_messages;

-- consultation_notes policies
DROP POLICY IF EXISTS "Participantes podem ver notas da consulta" ON consultation_notes;
DROP POLICY IF EXISTS "Users can view notes from their consultations" ON consultation_notes;
DROP POLICY IF EXISTS "Nutricionistas podem criar notas" ON consultation_notes;
DROP POLICY IF EXISTS "Users can manage notes in their consultations" ON consultation_notes;
DROP POLICY IF EXISTS "Autores podem atualizar suas notas" ON consultation_notes;
DROP POLICY IF EXISTS "Autores podem deletar suas notas" ON consultation_notes;
DROP POLICY IF EXISTS "Admins podem ver todas as notas" ON consultation_notes;

-- patient_favorite_nutritionists policies
DROP POLICY IF EXISTS "Pacientes podem ver seus favoritos" ON patient_favorite_nutritionists;
DROP POLICY IF EXISTS "Pacientes podem adicionar favoritos" ON patient_favorite_nutritionists;
DROP POLICY IF EXISTS "Pacientes podem remover favoritos" ON patient_favorite_nutritionists;
DROP POLICY IF EXISTS "Admins podem ver todos os favoritos" ON patient_favorite_nutritionists;

-- consultation_reviews policies
DROP POLICY IF EXISTS "Participantes podem ver avaliações da consulta" ON consultation_reviews;
DROP POLICY IF EXISTS "Pacientes podem criar avaliações" ON consultation_reviews;
DROP POLICY IF EXISTS "Pacientes podem atualizar suas avaliações" ON consultation_reviews;
DROP POLICY IF EXISTS "Pacientes podem deletar suas avaliações" ON consultation_reviews;
DROP POLICY IF EXISTS "Admins podem ver todas as avaliações" ON consultation_reviews;

-- patient_profiles policies
DROP POLICY IF EXISTS "Users can view their own patient profile" ON patient_profiles;
DROP POLICY IF EXISTS "Users can update their own patient profile" ON patient_profiles;

-- nutritionist_profiles policies
DROP POLICY IF EXISTS "Public can view nutritionist profiles" ON nutritionist_profiles;
DROP POLICY IF EXISTS "Users can view their own nutritionist profile" ON nutritionist_profiles;
DROP POLICY IF EXISTS "Users can update their own nutritionist profile" ON nutritionist_profiles;

-- 3. Criar políticas consolidadas e corretas

-- ========== AUTH.USERS POLICIES ==========
CREATE POLICY "Users can view their own profile" ON auth.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view profiles during consultations" ON auth.users
    FOR SELECT USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE (consultations.patient_id = auth.users.id AND consultations.nutritionist_id = auth.uid())
               OR (consultations.nutritionist_id = auth.users.id AND consultations.patient_id = auth.uid())
        )
    );

-- ========== CONSULTATIONS POLICIES ==========
CREATE POLICY "Users can view their own consultations" ON consultations
    FOR SELECT USING (
        auth.uid() = patient_id OR 
        auth.uid() = nutritionist_id
    );

CREATE POLICY "Users can create consultations" ON consultations
    FOR INSERT WITH CHECK (
        auth.uid() = patient_id OR 
        auth.uid() = nutritionist_id
    );

CREATE POLICY "Users can update their own consultations" ON consultations
    FOR UPDATE USING (
        auth.uid() = patient_id OR 
        auth.uid() = nutritionist_id
    );

-- ========== CONSULTATION_MESSAGES POLICIES ==========
CREATE POLICY "Users can view messages from their consultations" ON consultation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_messages.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their consultations" ON consultation_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_messages.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON consultation_messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- ========== CONSULTATION_NOTES POLICIES ==========
CREATE POLICY "Users can view notes from their consultations" ON consultation_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_notes.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

CREATE POLICY "Users can create notes in their consultations" ON consultation_notes
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_notes.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own notes" ON consultation_notes
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own notes" ON consultation_notes
    FOR DELETE USING (auth.uid() = author_id);

-- ========== PATIENT_FAVORITE_NUTRITIONISTS POLICIES ==========
-- Corrigir para usar user_id em vez de profile_id
CREATE POLICY "Patients can view their favorites" ON patient_favorite_nutritionists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_profiles.id = patient_favorite_nutritionists.patient_id 
            AND patient_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can add favorites" ON patient_favorite_nutritionists
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_profiles.id = patient_favorite_nutritionists.patient_id 
            AND patient_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can remove favorites" ON patient_favorite_nutritionists
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_profiles.id = patient_favorite_nutritionists.patient_id 
            AND patient_profiles.user_id = auth.uid()
        )
    );

-- ========== CONSULTATION_REVIEWS POLICIES ==========
CREATE POLICY "Users can view reviews from their consultations" ON consultation_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_reviews.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

CREATE POLICY "Patients can create reviews" ON consultation_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = patient_id AND
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_reviews.consultation_id 
            AND consultations.patient_id = auth.uid()
            AND consultations.status = 'completed'
        )
    );

CREATE POLICY "Patients can update their reviews" ON consultation_reviews
    FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their reviews" ON consultation_reviews
    FOR DELETE USING (auth.uid() = patient_id);

-- ========== PATIENT_PROFILES POLICIES ==========
CREATE POLICY "Users can view their own patient profile" ON patient_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own patient profile" ON patient_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patient profile" ON patient_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========== NUTRITIONIST_PROFILES POLICIES ==========
CREATE POLICY "Public can view nutritionist profiles" ON nutritionist_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own nutritionist profile" ON nutritionist_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutritionist profile" ON nutritionist_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========== ADMIN POLICIES ==========
-- Políticas para administradores (se a tabela user_roles existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        -- Consultations
        EXECUTE 'CREATE POLICY "Admins can manage all consultations" ON consultations
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid()
                    AND user_roles.role = ''admin''
                )
            )';
        
        -- Consultation messages
        EXECUTE 'CREATE POLICY "Admins can manage all messages" ON consultation_messages
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid()
                    AND user_roles.role = ''admin''
                )
            )';
        
        -- Consultation notes
        EXECUTE 'CREATE POLICY "Admins can manage all notes" ON consultation_notes
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid()
                    AND user_roles.role = ''admin''
                )
            )';
        
        -- Patient favorites
        EXECUTE 'CREATE POLICY "Admins can manage all favorites" ON patient_favorite_nutritionists
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid()
                    AND user_roles.role = ''admin''
                )
            )';
        
        -- Consultation reviews
        EXECUTE 'CREATE POLICY "Admins can manage all reviews" ON consultation_reviews
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid()
                    AND user_roles.role = ''admin''
                )
            )';
    END IF;
END $$;

COMMIT;

-- Verificar se as políticas foram aplicadas corretamente
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'Habilitado' ELSE 'Desabilitado' END as rls_status
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
AND tablename IN ('users', 'consultations', 'consultation_messages', 'consultation_notes', 'patient_favorite_nutritionists', 'consultation_reviews', 'patient_profiles', 'nutritionist_profiles')
ORDER BY schemaname, tablename;

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname IN ('public', 'auth')
AND tablename IN ('users', 'consultations', 'consultation_messages', 'consultation_notes', 'patient_favorite_nutritionists', 'consultation_reviews', 'patient_profiles', 'nutritionist_profiles')
ORDER BY schemaname, tablename, policyname;