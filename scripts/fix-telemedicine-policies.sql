-- Corrigir e adicionar políticas RLS para telemedicina

-- 1. Habilitar RLS em todas as tabelas se não estiver habilitado
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritionist_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para consultations
DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
CREATE POLICY "Users can view their own consultations" ON consultations
    FOR SELECT USING (
        auth.uid() = patient_id OR 
        auth.uid() = nutritionist_id
    );

DROP POLICY IF EXISTS "Users can update their own consultations" ON consultations;
CREATE POLICY "Users can update their own consultations" ON consultations
    FOR UPDATE USING (
        auth.uid() = patient_id OR 
        auth.uid() = nutritionist_id
    );

DROP POLICY IF EXISTS "Nutritionists can insert consultations" ON consultations;
CREATE POLICY "Nutritionists can insert consultations" ON consultations
    FOR INSERT WITH CHECK (
        auth.uid() = nutritionist_id OR 
        auth.uid() = patient_id
    );

-- 3. Políticas para consultation_messages
DROP POLICY IF EXISTS "Users can view messages from their consultations" ON consultation_messages;
CREATE POLICY "Users can view messages from their consultations" ON consultation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_messages.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in their consultations" ON consultation_messages;
CREATE POLICY "Users can insert messages in their consultations" ON consultation_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_messages.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        ) AND auth.uid() = sender_id
    );

-- 4. Políticas para consultation_notes
DROP POLICY IF EXISTS "Users can view notes from their consultations" ON consultation_notes;
CREATE POLICY "Users can view notes from their consultations" ON consultation_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_notes.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can manage notes in their consultations" ON consultation_notes;
CREATE POLICY "Users can manage notes in their consultations" ON consultation_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_notes.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        ) AND auth.uid() = created_by
    );

-- 5. Políticas para visualização de perfis durante consultas
DROP POLICY IF EXISTS "Users can view profiles during consultations" ON patient_profiles;
CREATE POLICY "Users can view profiles during consultations" ON patient_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.patient_id = patient_profiles.user_id 
            AND consultations.nutritionist_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view nutritionist profiles during consultations" ON nutritionist_profiles;
CREATE POLICY "Users can view nutritionist profiles during consultations" ON nutritionist_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.nutritionist_id = nutritionist_profiles.user_id 
            AND consultations.patient_id = auth.uid()
        ) OR
        -- Permitir visualização pública para busca
        TRUE
    );

-- 6. Criar tabela para administradores se não existir
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política para administradores
DROP POLICY IF EXISTS "Admins can view all data" ON consultations;
CREATE POLICY "Admins can view all data" ON consultations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- 7. Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = $1 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Políticas para views de tempo real
DROP POLICY IF EXISTS "Users can view realtime messages" ON consultation_messages_realtime;
CREATE POLICY "Users can view realtime messages" ON consultation_messages_realtime
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_messages_realtime.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can view realtime notes" ON consultation_notes_realtime;
CREATE POLICY "Users can view realtime notes" ON consultation_notes_realtime
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_notes_realtime.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );
