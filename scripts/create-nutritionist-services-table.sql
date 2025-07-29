-- Criar tabela de serviços dos nutricionistas
CREATE TABLE IF NOT EXISTS nutritionist_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nutritionist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL DEFAULT 45, -- duração em minutos
    consultation_type VARCHAR(20) NOT NULL DEFAULT 'video' CHECK (consultation_type IN ('video', 'audio', 'both')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nutritionist_services_nutritionist_id ON nutritionist_services(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_nutritionist_services_active ON nutritionist_services(is_active);

-- RLS (Row Level Security)
ALTER TABLE nutritionist_services ENABLE ROW LEVEL SECURITY;

-- Política para nutricionistas verem apenas seus próprios serviços
CREATE POLICY "Nutricionistas podem ver seus próprios serviços" ON nutritionist_services
    FOR SELECT USING (
        nutritionist_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type IN ('admin', 'paciente')
        )
    );

-- Política para nutricionistas gerenciarem seus próprios serviços
CREATE POLICY "Nutricionistas podem gerenciar seus próprios serviços" ON nutritionist_services
    FOR ALL USING (nutritionist_id = auth.uid());

-- Inserir alguns serviços de exemplo
INSERT INTO nutritionist_services (nutritionist_id, service_name, description, price, duration, consultation_type) 
SELECT 
    np.user_id,
    'Consulta Nutricional Completa',
    'Avaliação nutricional completa com análise de exames, medidas antropométricas e elaboração de plano alimentar personalizado.',
    150.00,
    60,
    'video'
FROM nutritionist_profiles np
WHERE np.full_name LIKE '%Ana%'
LIMIT 1;

INSERT INTO nutritionist_services (nutritionist_id, service_name, description, price, duration, consultation_type) 
SELECT 
    np.user_id,
    'Consulta de Retorno',
    'Acompanhamento nutricional com ajustes no plano alimentar e esclarecimento de dúvidas.',
    80.00,
    30,
    'both'
FROM nutritionist_profiles np
WHERE np.full_name LIKE '%Ana%'
LIMIT 1;

INSERT INTO nutritionist_services (nutritionist_id, service_name, description, price, duration, consultation_type) 
SELECT 
    np.user_id,
    'Orientação Nutricional Express',
    'Consulta rápida para esclarecimento de dúvidas e orientações pontuais sobre alimentação.',
    50.00,
    20,
    'audio'
FROM nutritionist_profiles np
WHERE np.full_name LIKE '%Ana%'
LIMIT 1;

-- Inserir serviços para outros nutricionistas também
INSERT INTO nutritionist_services (nutritionist_id, service_name, description, price, duration, consultation_type) 
SELECT 
    np.user_id,
    'Consulta de Nutrição Esportiva',
    'Consulta especializada em nutrição esportiva com foco em performance e composição corporal.',
    180.00,
    45,
    'video'
FROM nutritionist_profiles np
WHERE np.full_name NOT LIKE '%Ana%'
LIMIT 3;

INSERT INTO nutritionist_services (nutritionist_id, service_name, description, price, duration, consultation_type) 
SELECT 
    np.user_id,
    'Acompanhamento Mensal',
    'Consulta de acompanhamento mensal com ajustes no plano alimentar.',
    100.00,
    30,
    'both'
FROM nutritionist_profiles np
WHERE np.full_name NOT LIKE '%Ana%'
LIMIT 3;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_nutritionist_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nutritionist_services_updated_at
    BEFORE UPDATE ON nutritionist_services
    FOR EACH ROW
    EXECUTE FUNCTION update_nutritionist_services_updated_at();

-- Comentários para documentação
COMMENT ON TABLE nutritionist_services IS 'Serviços oferecidos pelos nutricionistas';
COMMENT ON COLUMN nutritionist_services.consultation_type IS 'Tipo de consulta: video, audio ou both';
COMMENT ON COLUMN nutritionist_services.duration IS 'Duração do serviço em minutos';
COMMENT ON COLUMN nutritionist_services.price IS 'Preço do serviço em reais';
