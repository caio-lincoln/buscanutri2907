-- Corrigir tabelas de telemedicina e adicionar campos faltantes

-- 1. Criar views para compatibilidade com o código existente
CREATE OR REPLACE VIEW consultation_messages_realtime AS
SELECT * FROM consultation_messages;

CREATE OR REPLACE VIEW consultation_notes_realtime AS
SELECT * FROM consultation_notes;

-- 2. Adicionar campos faltantes na tabela nutritionist_profiles
ALTER TABLE nutritionist_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- 3. Padronizar campo CRN (alguns lugares usam crn_number, outros crn)
ALTER TABLE nutritionist_profiles 
ADD COLUMN IF NOT EXISTS crn TEXT;

-- Copiar dados de crn_number para crn se existir
UPDATE nutritionist_profiles 
SET crn = crn_number 
WHERE crn IS NULL AND crn_number IS NOT NULL;

-- 4. Criar função get_patient_stats que estava faltando
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

-- 5. Adicionar trigger para atualizar rating do nutricionista automaticamente
CREATE OR REPLACE FUNCTION update_nutritionist_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE nutritionist_profiles 
    SET 
        rating = (
            SELECT AVG(nutritionist_rating)::DECIMAL(3,2)
            FROM consultations 
            WHERE nutritionist_id = NEW.nutritionist_id 
            AND nutritionist_rating IS NOT NULL
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM consultations 
            WHERE nutritionist_id = NEW.nutritionist_id 
            AND nutritionist_rating IS NOT NULL
        )
    WHERE user_id = NEW.nutritionist_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_update_nutritionist_rating ON consultations;
CREATE TRIGGER trigger_update_nutritionist_rating
    AFTER INSERT OR UPDATE OF nutritionist_rating ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_nutritionist_rating();

-- 6. Adicionar campos de timestamps em todas as tabelas se não existirem
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE consultation_messages 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE consultation_notes 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 7. Criar função para limpeza de dados antigos
CREATE OR REPLACE FUNCTION cleanup_old_consultations()
RETURNS void AS $$
BEGIN
    -- Remover consultas canceladas com mais de 30 dias
    DELETE FROM consultations 
    WHERE status = 'cancelled' 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Remover mensagens de consultas antigas (mais de 1 ano)
    DELETE FROM consultation_messages 
    WHERE consultation_id IN (
        SELECT id FROM consultations 
        WHERE created_at < NOW() - INTERVAL '1 year'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Adicionar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
DROP TRIGGER IF EXISTS update_consultations_updated_at ON consultations;
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultation_messages_updated_at ON consultation_messages;
CREATE TRIGGER update_consultation_messages_updated_at
    BEFORE UPDATE ON consultation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultation_notes_updated_at ON consultation_notes;
CREATE TRIGGER update_consultation_notes_updated_at
    BEFORE UPDATE ON consultation_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
