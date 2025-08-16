-- Criar tabela de sessões de teleconsulta
CREATE TABLE teleconsulta_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutritionist_id UUID NOT NULL REFERENCES nutritionist_profiles(id),
    patient_id UUID NOT NULL REFERENCES patient_profiles(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    join_url TEXT NOT NULL,
    session_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para teleconsulta_sessions
CREATE INDEX idx_teleconsulta_sessions_nutritionist_id ON teleconsulta_sessions(nutritionist_id);
CREATE INDEX idx_teleconsulta_sessions_patient_id ON teleconsulta_sessions(patient_id);
CREATE INDEX idx_teleconsulta_sessions_scheduled_at ON teleconsulta_sessions(scheduled_at);
CREATE INDEX idx_teleconsulta_sessions_status ON teleconsulta_sessions(status);

-- Criar tabela de participantes da teleconsulta
CREATE TABLE teleconsulta_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES teleconsulta_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('nutritionist', 'patient')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    audio_enabled BOOLEAN DEFAULT true,
    video_enabled BOOLEAN DEFAULT true
);

-- Criar índices para teleconsulta_participants
CREATE INDEX idx_teleconsulta_participants_session_id ON teleconsulta_participants(session_id);
CREATE INDEX idx_teleconsulta_participants_user_id ON teleconsulta_participants(user_id);

-- Criar tabela de disponibilidade da agenda
CREATE TABLE agenda_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutritionist_id UUID NOT NULL REFERENCES nutritionist_profiles(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para agenda_availability
CREATE INDEX idx_agenda_availability_nutritionist_id ON agenda_availability(nutritionist_id);
CREATE INDEX idx_agenda_availability_day_of_week ON agenda_availability(day_of_week);

-- Criar tabela de gravações de teleconsulta
CREATE TABLE teleconsulta_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES teleconsulta_sessions(id),
    file_url TEXT NOT NULL,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para teleconsulta_recordings
CREATE INDEX idx_teleconsulta_recordings_session_id ON teleconsulta_recordings(session_id);

-- Configurar permissões para teleconsulta_sessions
GRANT SELECT ON teleconsulta_sessions TO anon;
GRANT ALL PRIVILEGES ON teleconsulta_sessions TO authenticated;

-- Configurar permissões para teleconsulta_participants
GRANT SELECT ON teleconsulta_participants TO anon;
GRANT ALL PRIVILEGES ON teleconsulta_participants TO authenticated;

-- Configurar permissões para agenda_availability
GRANT SELECT ON agenda_availability TO anon;
GRANT ALL PRIVILEGES ON agenda_availability TO authenticated;

-- Configurar permissões para teleconsulta_recordings
GRANT SELECT ON teleconsulta_recordings TO anon;
GRANT ALL PRIVILEGES ON teleconsulta_recordings TO authenticated;

-- Inserir dados iniciais de disponibilidade para nutricionistas existentes
INSERT INTO agenda_availability (nutritionist_id, day_of_week, start_time, end_time, is_available)
SELECT 
    id,
    generate_series(1, 5) as day_of_week,
    '09:00:00'::time as start_time,
    '17:00:00'::time as end_time,
    true as is_available
FROM nutritionist_profiles
LIMIT 5;

-- Habilitar RLS (Row Level Security) para todas as tabelas
ALTER TABLE teleconsulta_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teleconsulta_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE teleconsulta_recordings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para teleconsulta_sessions
CREATE POLICY "Users can view their own teleconsulta sessions" ON teleconsulta_sessions
    FOR SELECT USING (
        auth.uid() = nutritionist_id OR 
        auth.uid() = patient_id
    );

CREATE POLICY "Nutritionists can create teleconsulta sessions" ON teleconsulta_sessions
    FOR INSERT WITH CHECK (auth.uid() = nutritionist_id);

CREATE POLICY "Users can update their own teleconsulta sessions" ON teleconsulta_sessions
    FOR UPDATE USING (
        auth.uid() = nutritionist_id OR 
        auth.uid() = patient_id
    );

-- Políticas RLS para teleconsulta_participants
CREATE POLICY "Users can view participants of their sessions" ON teleconsulta_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teleconsulta_sessions 
            WHERE id = session_id 
            AND (nutritionist_id = auth.uid() OR patient_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert themselves as participants" ON teleconsulta_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON teleconsulta_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para agenda_availability
CREATE POLICY "Anyone can view agenda availability" ON agenda_availability
    FOR SELECT USING (true);

CREATE POLICY "Nutritionists can manage their own availability" ON agenda_availability
    FOR ALL USING (auth.uid() = nutritionist_id);

-- Políticas RLS para teleconsulta_recordings
CREATE POLICY "Users can view recordings of their sessions" ON teleconsulta_recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teleconsulta_sessions 
            WHERE id = session_id 
            AND (nutritionist_id = auth.uid() OR patient_id = auth.uid())
        )
    );

CREATE POLICY "System can manage recordings" ON teleconsulta_recordings
    FOR ALL USING (true);