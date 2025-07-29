-- Criar tabelas para o sistema de telemedicina

-- Tabela de consultas
CREATE TABLE IF NOT EXISTS consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30, -- duração em minutos
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
    consultation_type VARCHAR(10) NOT NULL DEFAULT 'video' CHECK (consultation_type IN ('video', 'audio')),
    notes TEXT,
    recording_url TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de mensagens das consultas (chat)
CREATE TABLE IF NOT EXISTS consultation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
    file_url TEXT,
    file_name TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de notas das consultas
CREATE TABLE IF NOT EXISTS consultation_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (category IN ('symptoms', 'diagnosis', 'treatment', 'followup', 'general')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de nutricionistas favoritos dos pacientes
CREATE TABLE IF NOT EXISTS patient_favorite_nutritionists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, nutritionist_id)
);

-- Tabela de avaliações das consultas
CREATE TABLE IF NOT EXISTS consultation_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(consultation_id, patient_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_nutritionist_id ON consultations(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_time ON consultations(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation_id ON consultation_messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_sender_id ON consultation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_sent_at ON consultation_messages(sent_at);

CREATE INDEX IF NOT EXISTS idx_consultation_notes_consultation_id ON consultation_notes(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_author_id ON consultation_notes(author_id);

CREATE INDEX IF NOT EXISTS idx_patient_favorite_nutritionists_patient_id ON patient_favorite_nutritionists(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_favorite_nutritionists_nutritionist_id ON patient_favorite_nutritionists(nutritionist_id);

CREATE INDEX IF NOT EXISTS idx_consultation_reviews_consultation_id ON consultation_reviews(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_reviews_patient_id ON consultation_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_reviews_nutritionist_id ON consultation_reviews(nutritionist_id);

-- Relacionamentos extras com tabelas de perfil
-- FK -> nutritionist_profiles.user_id (para permitir join implícito)
DO $$
BEGIN
  -- cria a FK apenas se ainda não existir
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'consultations_nutritionist_id_fkey_profiles'
  ) THEN
    ALTER TABLE consultations
      ADD CONSTRAINT consultations_nutritionist_id_fkey_profiles
      FOREIGN KEY (nutritionist_id)
      REFERENCES nutritionist_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- FK -> patient_profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'consultations_patient_id_fkey_profiles'
  ) THEN
    ALTER TABLE consultations
      ADD CONSTRAINT consultations_patient_id_fkey_profiles
      FOREIGN KEY (patient_id)
      REFERENCES patient_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- Índices para as novas FKs
CREATE INDEX IF NOT EXISTS idx_consultations_nutritionist_profile
  ON consultations (nutritionist_id);

CREATE INDEX IF NOT EXISTS idx_consultations_patient_profile
  ON consultations (patient_id);

-- Criar triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consultations_updated_at 
    BEFORE UPDATE ON consultations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_notes_updated_at 
    BEFORE UPDATE ON consultation_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
