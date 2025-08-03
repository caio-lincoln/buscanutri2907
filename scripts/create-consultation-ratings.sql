-- Criar tabela de avaliações de consultas
CREATE TABLE IF NOT EXISTS consultation_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que cada consulta só pode ter uma avaliação
    UNIQUE(consultation_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_consultation_ratings_nutritionist_id ON consultation_ratings(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_consultation_ratings_patient_id ON consultation_ratings(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_ratings_created_at ON consultation_ratings(created_at);

-- RLS (Row Level Security)
ALTER TABLE consultation_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Pacientes podem criar avaliações de suas próprias consultas" ON consultation_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = patient_id AND
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE id = consultation_id 
            AND patient_id = auth.uid() 
            AND status = 'completed'
        )
    );

CREATE POLICY "Pacientes podem ver suas próprias avaliações" ON consultation_ratings
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Nutricionistas podem ver avaliações de suas consultas" ON consultation_ratings
    FOR SELECT USING (auth.uid() = nutritionist_id);

CREATE POLICY "Pacientes podem atualizar suas próprias avaliações" ON consultation_ratings
    FOR UPDATE USING (auth.uid() = patient_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_consultation_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_consultation_ratings_updated_at
    BEFORE UPDATE ON consultation_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_consultation_ratings_updated_at();

-- Função para atualizar automaticamente o rating do nutricionista
CREATE OR REPLACE FUNCTION update_nutritionist_rating_on_review()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calcular nova média e contagem de avaliações
    SELECT 
        COALESCE(AVG(rating), 5.0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM consultation_ratings
    WHERE nutritionist_id = COALESCE(NEW.nutritionist_id, OLD.nutritionist_id);
    
    -- Se não há avaliações, manter rating padrão 5.0
    IF review_count = 0 THEN
        avg_rating := 5.0;
    END IF;
    
    -- Atualizar o perfil do nutricionista
    UPDATE nutritionist_profiles 
    SET 
        rating = avg_rating,
        total_reviews = review_count,
        updated_at = NOW()
    WHERE user_id = COALESCE(NEW.nutritionist_id, OLD.nutritionist_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar rating do nutricionista
CREATE TRIGGER update_nutritionist_rating_on_insert
    AFTER INSERT ON consultation_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_nutritionist_rating_on_review();

CREATE TRIGGER update_nutritionist_rating_on_update
    AFTER UPDATE ON consultation_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_nutritionist_rating_on_review();

CREATE TRIGGER update_nutritionist_rating_on_delete
    AFTER DELETE ON consultation_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_nutritionist_rating_on_review();