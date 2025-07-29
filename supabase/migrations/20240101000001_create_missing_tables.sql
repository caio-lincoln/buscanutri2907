-- Script para criar tabelas que podem estar faltando no banco de dados
-- Execute este script no SQL Editor do Supabase Dashboard

-- Tabela de especialidades
CREATE TABLE IF NOT EXISTS public.specialties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de relacionamento nutricionista-especialidades
CREATE TABLE IF NOT EXISTS public.nutritionist_specialties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
    specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(nutritionist_id, specialty_id)
);

-- Tabela de localizações
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Brasil',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(city, state, country)
);

-- Tabela de disponibilidade dos nutricionistas
CREATE TABLE IF NOT EXISTS public.nutritionist_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo, 6 = Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    type VARCHAR(50) DEFAULT 'consultation' CHECK (type IN ('consultation', 'follow_up', 'emergency')),
    is_online BOOLEAN DEFAULT false,
    meeting_url TEXT,
    notes TEXT,
    price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de favoritos dos pacientes
CREATE TABLE IF NOT EXISTS public.patient_favorite_nutritionists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(patient_id, nutritionist_id)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'appointment', 'message')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de serviços dos nutricionistas
CREATE TABLE IF NOT EXISTS public.nutritionist_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    is_online BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de conversas de chat
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(patient_id, nutritionist_id)
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio')),
    file_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_nutritionist_specialties_nutritionist_id ON public.nutritionist_specialties(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_nutritionist_specialties_specialty_id ON public.nutritionist_specialties(specialty_id);
CREATE INDEX IF NOT EXISTS idx_nutritionist_availability_nutritionist_id ON public.nutritionist_availability(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist_id ON public.appointments(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_patient_favorites_patient_id ON public.patient_favorite_nutritionists(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_favorites_nutritionist_id ON public.patient_favorite_nutritionists(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_nutritionist_services_nutritionist_id ON public.nutritionist_services(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_nutritionist_id ON public.reviews(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_patient_id ON public.reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_patient_id ON public.chat_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_nutritionist_id ON public.chat_conversations(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritionist_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritionist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_favorite_nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritionist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança básicas (leitura pública, escrita autenticada)
CREATE POLICY "Especialidades são visíveis para todos" ON public.specialties FOR SELECT USING (true);
CREATE POLICY "Localizações são visíveis para todos" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Disponibilidade é visível para todos" ON public.nutritionist_availability FOR SELECT USING (true);
CREATE POLICY "Serviços são visíveis para todos" ON public.nutritionist_services FOR SELECT USING (true);
CREATE POLICY "Avaliações são visíveis para todos" ON public.reviews FOR SELECT USING (true);

-- Políticas para usuários autenticados
CREATE POLICY "Usuários podem ver suas notificações" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem gerenciar suas notificações" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Inserir especialidades padrão
INSERT INTO public.specialties (name, description, icon) VALUES
('Emagrecimento', 'Especialização em perda de peso e reeducação alimentar', 'weight-loss'),
('Nutrição Esportiva', 'Nutrição para atletas e praticantes de atividade física', 'sports'),
('Nutrição Clínica', 'Tratamento nutricional de doenças', 'medical'),
('Nutrição Infantil', 'Alimentação para crianças e adolescentes', 'child'),
('Nutrição Geriátrica', 'Alimentação para idosos', 'elderly'),
('Vegetarianismo/Veganismo', 'Dietas baseadas em plantas', 'plant'),
('Transtornos Alimentares', 'Tratamento de distúrbios alimentares', 'mental-health'),
('Nutrição Funcional', 'Abordagem funcional da alimentação', 'functional'),
('Diabetes', 'Controle nutricional do diabetes', 'diabetes'),
('Hipertensão', 'Controle nutricional da pressão arterial', 'heart')
ON CONFLICT (name) DO NOTHING;

-- Inserir localizações principais do Brasil
INSERT INTO public.locations (city, state) VALUES
('São Paulo', 'SP'),
('Rio de Janeiro', 'RJ'),
('Belo Horizonte', 'MG'),
('Brasília', 'DF'),
('Salvador', 'BA'),
('Fortaleza', 'CE'),
('Recife', 'PE'),
('Porto Alegre', 'RS'),
('Curitiba', 'PR'),
('Goiânia', 'GO'),
('Belém', 'PA'),
('Manaus', 'AM'),
('Vitória', 'ES'),
('Florianópolis', 'SC'),
('Natal', 'RN'),
('João Pessoa', 'PB'),
('Aracaju', 'SE'),
('Maceió', 'AL'),
('Teresina', 'PI'),
('São Luís', 'MA'),
('Cuiabá', 'MT'),
('Campo Grande', 'MS'),
('Porto Velho', 'RO'),
('Rio Branco', 'AC'),
('Boa Vista', 'RR'),
('Macapá', 'AP'),
('Palmas', 'TO')
ON CONFLICT (city, state, country) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_nutritionist_availability_updated_at BEFORE UPDATE ON public.nutritionist_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutritionist_services_updated_at BEFORE UPDATE ON public.nutritionist_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE public.specialties IS 'Especialidades disponíveis para nutricionistas';
COMMENT ON TABLE public.nutritionist_specialties IS 'Relacionamento entre nutricionistas e suas especialidades';
COMMENT ON TABLE public.locations IS 'Cidades e estados disponíveis';
COMMENT ON TABLE public.nutritionist_availability IS 'Horários de disponibilidade dos nutricionistas';
COMMENT ON TABLE public.appointments IS 'Agendamentos de consultas';
COMMENT ON TABLE public.patient_favorite_nutritionists IS 'Nutricionistas favoritos dos pacientes';
COMMENT ON TABLE public.notifications IS 'Notificações do sistema';
COMMENT ON TABLE public.nutritionist_services IS 'Serviços oferecidos pelos nutricionistas';
COMMENT ON TABLE public.reviews IS 'Avaliações dos pacientes sobre os nutricionistas';
COMMENT ON TABLE public.chat_conversations IS 'Conversas entre pacientes e nutricionistas';
COMMENT ON TABLE public.chat_messages IS 'Mensagens das conversas';