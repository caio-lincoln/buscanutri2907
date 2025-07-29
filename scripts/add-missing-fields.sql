-- Adicionar campos e estruturas faltantes

-- 1. Adicionar campos faltantes em patient_profiles
ALTER TABLE patient_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS health_conditions TEXT[],
ADD COLUMN IF NOT EXISTS allergies TEXT[],
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Criar tabela de especialidades se não existir
CREATE TABLE IF NOT EXISTS specialties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir especialidades básicas
INSERT INTO specialties (name, description) VALUES
('Nutrição Clínica', 'Tratamento nutricional de doenças'),
('Nutrição Esportiva', 'Nutrição para atletas e praticantes de exercícios'),
('Nutrição Materno-Infantil', 'Nutrição para gestantes, lactantes e crianças'),
('Nutrição Geriátrica', 'Nutrição para idosos'),
('Nutrição Funcional', 'Abordagem funcional da nutrição'),
('Nutrição Comportamental', 'Aspectos psicológicos da alimentação'),
('Nutrição Vegetariana/Vegana', 'Dietas à base de plantas'),
('Nutrição Oncológica', 'Nutrição para pacientes com câncer')
ON CONFLICT (name) DO NOTHING;

-- 3. Criar tabela de relacionamento nutricionista-especialidades
CREATE TABLE IF NOT EXISTS nutritionist_specialties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nutritionist_id UUID REFERENCES nutritionist_profiles(user_id) ON DELETE CASCADE,
    specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nutritionist_id, specialty_id)
);

ALTER TABLE nutritionist_specialties ENABLE ROW LEVEL SECURITY;

-- Política para visualização de especialidades
CREATE POLICY "Anyone can view specialties" ON specialties FOR SELECT USING (true);
CREATE POLICY "Anyone can view nutritionist specialties" ON nutritionist_specialties FOR SELECT USING (true);

-- 4. Criar tabela de serviços do nutricionista
CREATE TABLE IF NOT EXISTS nutritionist_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nutritionist_id UUID REFERENCES nutritionist_profiles(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60, -- em minutos
    online_available BOOLEAN DEFAULT true,
    in_person_available BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nutritionist_services ENABLE ROW LEVEL SECURITY;

-- Política para serviços
CREATE POLICY "Anyone can view services" ON nutritionist_services FOR SELECT USING (true);
CREATE POLICY "Nutritionists can manage their services" ON nutritionist_services 
    FOR ALL USING (auth.uid() = nutritionist_id);

-- 5. Criar tabela de favoritos do paciente
CREATE TABLE IF NOT EXISTS patient_favorite_nutritionists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patient_profiles(user_id) ON DELETE CASCADE,
    nutritionist_id UUID REFERENCES nutritionist_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, nutritionist_id)
);

ALTER TABLE patient_favorite_nutritionists ENABLE ROW LEVEL SECURITY;

-- Política para favoritos
CREATE POLICY "Patients can manage their favorites" ON patient_favorite_nutritionists 
    FOR ALL USING (auth.uid() = patient_id);

-- 6. Adicionar campos de avaliação nas consultas
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS patient_rating INTEGER CHECK (patient_rating >= 1 AND patient_rating <= 5),
ADD COLUMN IF NOT EXISTS nutritionist_rating INTEGER CHECK (nutritionist_rating >= 1 AND nutritionist_rating <= 5),
ADD COLUMN IF NOT EXISTS patient_feedback TEXT,
ADD COLUMN IF NOT EXISTS nutritionist_feedback TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- 7. Criar função para buscar nutricionistas com filtros
CREATE OR REPLACE FUNCTION search_nutritionists(
    search_term TEXT DEFAULT '',
    specialty_filter TEXT DEFAULT '',
    location_filter TEXT DEFAULT '',
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    bio TEXT,
    location TEXT,
    profile_image_url TEXT,
    crn TEXT,
    rating DECIMAL,
    total_reviews INTEGER,
    specialties TEXT[],
    min_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        np.user_id,
        np.full_name,
        np.bio,
        np.location,
        np.profile_image_url,
        np.crn,
        np.rating,
        np.total_reviews,
        ARRAY_AGG(DISTINCT s.name) as specialties,
        MIN(ns.price) as min_price
    FROM nutritionist_profiles np
    LEFT JOIN nutritionist_specialties nsp ON np.user_id = nsp.nutritionist_id
    LEFT JOIN specialties s ON nsp.specialty_id = s.id
    LEFT JOIN nutritionist_services ns ON np.user_id = ns.nutritionist_id
    WHERE 
        (search_term = '' OR 
         np.full_name ILIKE '%' || search_term || '%' OR 
         np.bio ILIKE '%' || search_term || '%')
    AND (specialty_filter = '' OR s.name = specialty_filter)
    AND (location_filter = '' OR np.location = location_filter)
    GROUP BY np.user_id, np.full_name, np.bio, np.location, np.profile_image_url, np.crn, np.rating, np.total_reviews
    ORDER BY np.rating DESC NULLS LAST, np.total_reviews DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Inserir dados de exemplo para nutricionistas
INSERT INTO nutritionist_profiles (user_id, full_name, bio, location, crn, rating, total_reviews)
SELECT 
    gen_random_uuid(),
    'Dr. ' || (ARRAY['Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Costa', 'Fernanda Lima'])[i],
    'Nutricionista especializada em ' || (ARRAY['nutrição clínica', 'nutrição esportiva', 'nutrição funcional', 'nutrição materno-infantil', 'nutrição geriátrica'])[i],
    (ARRAY['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Porto Alegre, RS', 'Salvador, BA'])[i],
    'CRN-' || i || '/2024',
    4.0 + (i * 0.2),
    10 + (i * 5)
FROM generate_series(1, 5) as i
ON CONFLICT DO NOTHING;

-- 9. Inserir serviços de exemplo
INSERT INTO nutritionist_services (nutritionist_id, name, description, price, duration, online_available)
SELECT 
    np.user_id,
    'Consulta Nutricional',
    'Consulta completa com avaliação nutricional',
    80.00 + (random() * 50),
    60,
    true
FROM nutritionist_profiles np
ON CONFLICT DO NOTHING;
