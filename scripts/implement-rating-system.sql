-- Implementar sistema de avaliações completo
-- Adicionar campo rating para pacientes e atualizar sistema de avaliações

BEGIN;

-- 1. Adicionar campo rating para patient_profiles se não existir
ALTER TABLE patient_profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- 2. Atualizar nutritionist_profiles para usar rating padrão 5.0
UPDATE nutritionist_profiles 
SET rating = 5.0 
WHERE rating = 0 OR rating IS NULL;

ALTER TABLE nutritionist_profiles 
ALTER COLUMN rating SET DEFAULT 5.0;

-- 3. Atualizar patient_profiles para usar rating padrão 5.0
UPDATE patient_profiles 
SET rating = 5.0 
WHERE rating IS NULL;

-- 4. Criar função para atualizar rating do paciente baseado em avaliações
CREATE OR REPLACE FUNCTION update_patient_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE patient_profiles 
    SET 
        rating = (
            SELECT AVG(patient_rating)::DECIMAL(3,2)
            FROM consultations 
            WHERE patient_id = NEW.patient_id 
            AND patient_rating IS NOT NULL
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM consultations 
            WHERE patient_id = NEW.patient_id 
            AND patient_rating IS NOT NULL
        )
    WHERE user_id = NEW.patient_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para atualizar rating do paciente
DROP TRIGGER IF EXISTS trigger_update_patient_rating ON consultations;
CREATE TRIGGER trigger_update_patient_rating
    AFTER INSERT OR UPDATE OF patient_rating ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_rating();

-- 6. Atualizar função existente de rating do nutricionista para usar padrão 5.0
CREATE OR REPLACE FUNCTION update_nutritionist_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calcular média das avaliações
    SELECT 
        COALESCE(AVG(nutritionist_rating), 5.0)::DECIMAL(3,2),
        COUNT(*) FILTER (WHERE nutritionist_rating IS NOT NULL)
    INTO avg_rating, review_count
    FROM consultations 
    WHERE nutritionist_id = NEW.nutritionist_id;
    
    -- Se não há avaliações, manter 5.0
    IF review_count = 0 THEN
        avg_rating := 5.0;
    END IF;
    
    UPDATE nutritionist_profiles 
    SET 
        rating = avg_rating,
        total_reviews = review_count
    WHERE user_id = NEW.nutritionist_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função para calcular estatísticas de rating
CREATE OR REPLACE FUNCTION get_user_rating_stats(user_id UUID, user_type TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    avg_rating DECIMAL(3,2);
    total_reviews INTEGER;
BEGIN
    IF user_type = 'nutricionista' THEN
        SELECT rating, total_reviews 
        INTO avg_rating, total_reviews
        FROM nutritionist_profiles 
        WHERE nutritionist_profiles.user_id = get_user_rating_stats.user_id;
    ELSIF user_type = 'paciente' THEN
        SELECT rating, total_reviews 
        INTO avg_rating, total_reviews
        FROM patient_profiles 
        WHERE patient_profiles.user_id = get_user_rating_stats.user_id;
    END IF;
    
    SELECT json_build_object(
        'rating', COALESCE(avg_rating, 5.0),
        'totalReviews', COALESCE(total_reviews, 0),
        'userType', user_type
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar view para facilitar consultas de ratings
CREATE OR REPLACE VIEW user_ratings AS
SELECT 
    u.id as user_id,
    u.user_type,
    CASE 
        WHEN u.user_type = 'nutricionista' THEN np.rating
        WHEN u.user_type = 'paciente' THEN pp.rating
        ELSE 5.0
    END as rating,
    CASE 
        WHEN u.user_type = 'nutricionista' THEN np.total_reviews
        WHEN u.user_type = 'paciente' THEN pp.total_reviews
        ELSE 0
    END as total_reviews,
    CASE 
        WHEN u.user_type = 'nutricionista' THEN np.full_name
        WHEN u.user_type = 'paciente' THEN pp.full_name
        ELSE NULL
    END as full_name
FROM users u
LEFT JOIN nutritionist_profiles np ON u.id = np.user_id AND u.user_type = 'nutricionista'
LEFT JOIN patient_profiles pp ON u.id = pp.user_id AND u.user_type = 'paciente';

-- 9. Criar função para recalcular todos os ratings (útil para manutenção)
CREATE OR REPLACE FUNCTION recalculate_all_ratings()
RETURNS void AS $$
BEGIN
    -- Recalcular ratings dos nutricionistas
    UPDATE nutritionist_profiles 
    SET 
        rating = COALESCE(subq.avg_rating, 5.0),
        total_reviews = COALESCE(subq.review_count, 0)
    FROM (
        SELECT 
            nutritionist_id,
            AVG(nutritionist_rating)::DECIMAL(3,2) as avg_rating,
            COUNT(*) FILTER (WHERE nutritionist_rating IS NOT NULL) as review_count
        FROM consultations 
        WHERE nutritionist_rating IS NOT NULL
        GROUP BY nutritionist_id
    ) subq
    WHERE nutritionist_profiles.user_id = subq.nutritionist_id;
    
    -- Recalcular ratings dos pacientes
    UPDATE patient_profiles 
    SET 
        rating = COALESCE(subq.avg_rating, 5.0),
        total_reviews = COALESCE(subq.review_count, 0)
    FROM (
        SELECT 
            patient_id,
            AVG(patient_rating)::DECIMAL(3,2) as avg_rating,
            COUNT(*) FILTER (WHERE patient_rating IS NOT NULL) as review_count
        FROM consultations 
        WHERE patient_rating IS NOT NULL
        GROUP BY patient_id
    ) subq
    WHERE patient_profiles.user_id = subq.patient_id;
    
    -- Garantir que usuários sem avaliações tenham rating 5.0
    UPDATE nutritionist_profiles SET rating = 5.0 WHERE total_reviews = 0;
    UPDATE patient_profiles SET rating = 5.0 WHERE total_reviews = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Executar recálculo inicial
SELECT recalculate_all_ratings();

COMMIT;