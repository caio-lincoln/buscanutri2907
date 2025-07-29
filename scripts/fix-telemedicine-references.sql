-- Corrigir referências das tabelas de telemedicina
-- Problema: tabelas estão referenciando auth.users(id) em vez dos profile_id corretos

-- 1. Remover constraints antigas e recriar com referências corretas

-- Consultations table
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_patient_id_fkey;
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_nutritionist_id_fkey;

-- Consultation messages table
ALTER TABLE consultation_messages DROP CONSTRAINT IF EXISTS consultation_messages_sender_id_fkey;

-- Consultation notes table
ALTER TABLE consultation_notes DROP CONSTRAINT IF EXISTS consultation_notes_author_id_fkey;

-- Patient favorite nutritionists table
ALTER TABLE patient_favorite_nutritionists DROP CONSTRAINT IF EXISTS patient_favorite_nutritionists_patient_id_fkey;
ALTER TABLE patient_favorite_nutritionists DROP CONSTRAINT IF EXISTS patient_favorite_nutritionists_nutritionist_id_fkey;

-- Consultation reviews table
ALTER TABLE consultation_reviews DROP CONSTRAINT IF EXISTS consultation_reviews_patient_id_fkey;
ALTER TABLE consultation_reviews DROP CONSTRAINT IF EXISTS consultation_reviews_nutritionist_id_fkey;

-- 2. Recriar constraints com referências corretas

-- Consultations - referenciar profiles em vez de auth.users
ALTER TABLE consultations 
    ADD CONSTRAINT consultations_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES patient_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE consultations 
    ADD CONSTRAINT consultations_nutritionist_id_fkey 
    FOREIGN KEY (nutritionist_id) REFERENCES nutritionist_profiles(user_id) ON DELETE CASCADE;

-- Consultation messages - manter referência a auth.users pois pode ser qualquer usuário
ALTER TABLE consultation_messages 
    ADD CONSTRAINT consultation_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Consultation notes - manter referência a auth.users pois pode ser qualquer usuário
ALTER TABLE consultation_notes 
    ADD CONSTRAINT consultation_notes_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Patient favorite nutritionists - referenciar profiles
ALTER TABLE patient_favorite_nutritionists 
    ADD CONSTRAINT patient_favorite_nutritionists_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES patient_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE patient_favorite_nutritionists 
    ADD CONSTRAINT patient_favorite_nutritionists_nutritionist_id_fkey 
    FOREIGN KEY (nutritionist_id) REFERENCES nutritionist_profiles(user_id) ON DELETE CASCADE;

-- Consultation reviews - referenciar profiles
ALTER TABLE consultation_reviews 
    ADD CONSTRAINT consultation_reviews_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES patient_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE consultation_reviews 
    ADD CONSTRAINT consultation_reviews_nutritionist_id_fkey 
    FOREIGN KEY (nutritionist_id) REFERENCES nutritionist_profiles(user_id) ON DELETE CASCADE;

-- 3. Atualizar função get_patient_stats para usar as referências corretas
CREATE OR REPLACE FUNCTION get_patient_stats(patient_user_id UUID)
RETURNS JSON AS $$
DECLARE
    total_consultations INTEGER;
    scheduled_consultations INTEGER;
    completed_consultations INTEGER;
    favorite_nutritionists INTEGER;
    avg_rating DECIMAL(3,2);
BEGIN
    -- Total de consultas
    SELECT COUNT(*) INTO total_consultations
    FROM consultations c
    INNER JOIN patient_profiles pp ON c.patient_id = pp.user_id
    WHERE pp.user_id = patient_user_id;
    
    -- Consultas agendadas
    SELECT COUNT(*) INTO scheduled_consultations
    FROM consultations c
    INNER JOIN patient_profiles pp ON c.patient_id = pp.user_id
    WHERE pp.user_id = patient_user_id AND c.status = 'scheduled';
    
    -- Consultas completadas
    SELECT COUNT(*) INTO completed_consultations
    FROM consultations c
    INNER JOIN patient_profiles pp ON c.patient_id = pp.user_id
    WHERE pp.user_id = patient_user_id AND c.status = 'completed';
    
    -- Nutricionistas favoritos
    SELECT COUNT(*) INTO favorite_nutritionists
    FROM patient_favorite_nutritionists pfn
    INNER JOIN patient_profiles pp ON pfn.patient_id = pp.user_id
    WHERE pp.user_id = patient_user_id;
    
    -- Avaliação média dada pelo paciente
    SELECT AVG(rating) INTO avg_rating
    FROM consultation_reviews cr
    INNER JOIN patient_profiles pp ON cr.patient_id = pp.user_id
    WHERE pp.user_id = patient_user_id;
    
    RETURN json_build_object(
        'total_consultations', COALESCE(total_consultations, 0),
        'scheduled_consultations', COALESCE(scheduled_consultations, 0),
        'completed_consultations', COALESCE(completed_consultations, 0),
        'favorite_nutritionists', COALESCE(favorite_nutritionists, 0),
        'average_rating', COALESCE(avg_rating, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Garantir que as políticas RLS estejam corretas

-- Habilitar RLS nas tabelas se ainda não estiver
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_favorite_nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para consultations
DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
CREATE POLICY "Users can view their own consultations" ON consultations
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM patient_profiles WHERE user_id = consultations.patient_id
            UNION
            SELECT user_id FROM nutritionist_profiles WHERE user_id = consultations.nutritionist_id
        )
    );

DROP POLICY IF EXISTS "Users can insert their own consultations" ON consultations;
CREATE POLICY "Users can insert their own consultations" ON consultations
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM patient_profiles WHERE user_id = consultations.patient_id
            UNION
            SELECT user_id FROM nutritionist_profiles WHERE user_id = consultations.nutritionist_id
        )
    );

DROP POLICY IF EXISTS "Users can update their own consultations" ON consultations;
CREATE POLICY "Users can update their own consultations" ON consultations
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM patient_profiles WHERE user_id = consultations.patient_id
            UNION
            SELECT user_id FROM nutritionist_profiles WHERE user_id = consultations.nutritionist_id
        )
    );

-- Políticas para patient_favorite_nutritionists
DROP POLICY IF EXISTS "Patients can manage their favorites" ON patient_favorite_nutritionists;
CREATE POLICY "Patients can manage their favorites" ON patient_favorite_nutritionists
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM patient_profiles WHERE user_id = patient_favorite_nutritionists.patient_id
        )
    );

-- Políticas para consultation_reviews
DROP POLICY IF EXISTS "Users can view consultation reviews" ON consultation_reviews;
CREATE POLICY "Users can view consultation reviews" ON consultation_reviews
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM patient_profiles WHERE user_id = consultation_reviews.patient_id
            UNION
            SELECT user_id FROM nutritionist_profiles WHERE user_id = consultation_reviews.nutritionist_id
        )
    );

DROP POLICY IF EXISTS "Patients can create reviews" ON consultation_reviews;
CREATE POLICY "Patients can create reviews" ON consultation_reviews
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM patient_profiles WHERE user_id = consultation_reviews.patient_id
        )
    );

-- 5. Criar dados de teste se necessário
INSERT INTO patient_profiles (user_id, full_name, birth_date, phone)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', email),
    '1990-01-01'::date,
    '+55 11 99999-9999'
FROM auth.users 
WHERE raw_user_meta_data->>'user_type' = 'patient'
AND id NOT IN (SELECT user_id FROM patient_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO nutritionist_profiles (user_id, full_name, crn, bio, location)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', email),
    'CRN-' || EXTRACT(YEAR FROM NOW()) || '/' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
    'Nutricionista especializado em saúde e bem-estar.',
    'São Paulo, SP'
FROM auth.users 
WHERE raw_user_meta_data->>'user_type' = 'nutritionist'
AND id NOT IN (SELECT user_id FROM nutritionist_profiles)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;