-- Corrigir permissões e políticas RLS para tabela users e outras tabelas

-- 1. Habilitar RLS na tabela users se não estiver habilitado
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas para permitir acesso aos dados de usuários durante consultas
DROP POLICY IF EXISTS "Users can view their own profile" ON auth.users;
CREATE POLICY "Users can view their own profile" ON auth.users
    FOR SELECT USING (auth.uid() = id);

-- 3. Permitir que nutricionistas vejam dados básicos de pacientes durante consultas
DROP POLICY IF EXISTS "Nutritionists can view patient data during consultations" ON auth.users;
CREATE POLICY "Nutritionists can view patient data during consultations" ON auth.users
    FOR SELECT USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE (consultations.patient_id = auth.users.id AND consultations.nutritionist_id = auth.uid())
               OR (consultations.nutritionist_id = auth.users.id AND consultations.patient_id = auth.uid())
        )
    );

-- 4. Corrigir políticas para patient_favorite_nutritionists
DROP POLICY IF EXISTS "Pacientes podem ver seus favoritos" ON patient_favorite_nutritionists;
CREATE POLICY "Pacientes podem ver seus favoritos" ON patient_favorite_nutritionists
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Pacientes podem adicionar favoritos" ON patient_favorite_nutritionists;
CREATE POLICY "Pacientes podem adicionar favoritos" ON patient_favorite_nutritionists
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Pacientes podem remover favoritos" ON patient_favorite_nutritionists;
CREATE POLICY "Pacientes podem remover favoritos" ON patient_favorite_nutritionists
    FOR DELETE USING (auth.uid() = patient_id);

-- 5. Corrigir políticas para consultation_reviews
DROP POLICY IF EXISTS "Participantes podem ver avaliações da consulta" ON consultation_reviews;
CREATE POLICY "Participantes podem ver avaliações da consulta" ON consultation_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_reviews.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Pacientes podem criar avaliações" ON consultation_reviews;
CREATE POLICY "Pacientes podem criar avaliações" ON consultation_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = patient_id AND
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_reviews.consultation_id 
            AND consultations.patient_id = auth.uid()
            AND consultations.status = 'completed'
        )
    );

DROP POLICY IF EXISTS "Pacientes podem atualizar suas avaliações" ON consultation_reviews;
CREATE POLICY "Pacientes podem atualizar suas avaliações" ON consultation_reviews
    FOR UPDATE USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Pacientes podem deletar suas avaliações" ON consultation_reviews;
CREATE POLICY "Pacientes podem deletar suas avaliações" ON consultation_reviews
    FOR DELETE USING (auth.uid() = patient_id);

-- 6. Garantir que a função get_patient_stats existe e está correta
CREATE OR REPLACE FUNCTION get_patient_stats(patient_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalConsultations', COALESCE(total_consultations, 0),
        'scheduledConsultations', COALESCE(scheduled_consultations, 0),
        'completedConsultations', COALESCE(completed_consultations, 0),
        'favoriteNutritionists', COALESCE(favorite_nutritionists, 0),
        'averageRating', COALESCE(average_rating, 0.0)
    ) INTO result
    FROM (
        SELECT 
            COUNT(*) as total_consultations,
            COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_consultations,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_consultations,
            (SELECT COUNT(*) FROM patient_favorite_nutritionists WHERE patient_id = patient_user_id) as favorite_nutritionists,
            AVG(CASE WHEN patient_rating IS NOT NULL THEN patient_rating ELSE 0 END) as average_rating
        FROM consultations 
        WHERE patient_id = patient_user_id
    ) stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Garantir que as tabelas tenham RLS habilitado
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_favorite_nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritionist_profiles ENABLE ROW LEVEL SECURITY;

-- 8. Permitir acesso público aos perfis de nutricionistas para busca
DROP POLICY IF EXISTS "Public can view nutritionist profiles" ON nutritionist_profiles;
CREATE POLICY "Public can view nutritionist profiles" ON nutritionist_profiles
    FOR SELECT USING (true);

-- 9. Permitir que usuários vejam seus próprios perfis
DROP POLICY IF EXISTS "Users can view their own patient profile" ON patient_profiles;
CREATE POLICY "Users can view their own patient profile" ON patient_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own nutritionist profile" ON nutritionist_profiles;
CREATE POLICY "Users can view their own nutritionist profile" ON nutritionist_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- 10. Permitir que usuários atualizem seus próprios perfis
DROP POLICY IF EXISTS "Users can update their own patient profile" ON patient_profiles;
CREATE POLICY "Users can update their own patient profile" ON patient_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own nutritionist profile" ON nutritionist_profiles;
CREATE POLICY "Users can update their own nutritionist profile" ON nutritionist_profiles
    FOR UPDATE USING (auth.uid() = user_id);

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