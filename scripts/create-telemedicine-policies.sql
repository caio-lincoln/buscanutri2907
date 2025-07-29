-- Políticas RLS para as tabelas de telemedicina

-- Habilitar RLS nas tabelas
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_favorite_nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela consultations
CREATE POLICY "Pacientes podem ver suas próprias consultas" ON consultations
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Nutricionistas podem ver suas próprias consultas" ON consultations
    FOR SELECT USING (auth.uid() = nutritionist_id);

CREATE POLICY "Pacientes podem criar consultas" ON consultations
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Nutricionistas podem atualizar suas consultas" ON consultations
    FOR UPDATE USING (auth.uid() = nutritionist_id);

CREATE POLICY "Pacientes podem cancelar suas consultas" ON consultations
    FOR UPDATE USING (auth.uid() = patient_id AND status = 'scheduled');

-- Políticas para a tabela consultation_messages
CREATE POLICY "Participantes podem ver mensagens da consulta" ON consultation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_messages.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

CREATE POLICY "Participantes podem enviar mensagens" ON consultation_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_messages.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

CREATE POLICY "Remetentes podem atualizar suas mensagens" ON consultation_messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Políticas para a tabela consultation_notes
CREATE POLICY "Participantes podem ver notas da consulta" ON consultation_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_notes.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

CREATE POLICY "Nutricionistas podem criar notas" ON consultation_notes
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_notes.consultation_id 
            AND consultations.nutritionist_id = auth.uid()
        )
    );

CREATE POLICY "Autores podem atualizar suas notas" ON consultation_notes
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Autores podem deletar suas notas" ON consultation_notes
    FOR DELETE USING (auth.uid() = author_id);

-- Políticas para a tabela patient_favorite_nutritionists
CREATE POLICY "Pacientes podem ver seus favoritos" ON patient_favorite_nutritionists
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Pacientes podem adicionar favoritos" ON patient_favorite_nutritionists
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Pacientes podem remover favoritos" ON patient_favorite_nutritionists
    FOR DELETE USING (auth.uid() = patient_id);

-- Políticas para a tabela consultation_reviews
CREATE POLICY "Participantes podem ver avaliações da consulta" ON consultation_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_reviews.consultation_id 
            AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
        )
    );

CREATE POLICY "Pacientes podem criar avaliações" ON consultation_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = patient_id AND
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_reviews.consultation_id 
            AND consultations.patient_id = auth.uid()
            AND consultations.status = 'completed'
        )
    );

CREATE POLICY "Pacientes podem atualizar suas avaliações" ON consultation_reviews
    FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Pacientes podem deletar suas avaliações" ON consultation_reviews
    FOR DELETE USING (auth.uid() = patient_id);

/* ------------------------------------------------------------------------- */
/*  Políticas de ADMIN                                                       */
/*  (admin = linha em user_roles com role = 'admin')                         */
/* ------------------------------------------------------------------------- */

-- Consultations
DROP POLICY IF EXISTS "Admins podem ver tudo"        ON consultations;
CREATE POLICY       "Admins podem ver tudo"          ON consultations
    FOR ALL USING (
        EXISTS (
            SELECT 1
              FROM public.user_roles
             WHERE user_roles.user_id = auth.uid()
               AND user_roles.role    = 'admin'
        )
    );

-- Consultation messages
DROP POLICY IF EXISTS "Admins podem ver todas as mensagens" ON consultation_messages;
CREATE POLICY       "Admins podem ver todas as mensagens"   ON consultation_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1
              FROM public.user_roles
             WHERE user_roles.user_id = auth.uid()
               AND user_roles.role    = 'admin'
        )
    );

-- Consultation notes
DROP POLICY IF EXISTS "Admins podem ver todas as notas"      ON consultation_notes;
CREATE POLICY       "Admins podem ver todas as notas"        ON consultation_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1
              FROM public.user_roles
             WHERE user_roles.user_id = auth.uid()
               AND user_roles.role    = 'admin'
        )
    );

-- Patient favourite nutritionists
DROP POLICY IF EXISTS "Admins podem ver todos os favoritos"  ON patient_favorite_nutritionists;
CREATE POLICY       "Admins podem ver todos os favoritos"    ON patient_favorite_nutritionists
    FOR ALL USING (
        EXISTS (
            SELECT 1
              FROM public.user_roles
             WHERE user_roles.user_id = auth.uid()
               AND user_roles.role    = 'admin'
        )
    );

-- Consultation reviews
DROP POLICY IF EXISTS "Admins podem ver todas as avaliações" ON consultation_reviews;
CREATE POLICY       "Admins podem ver todas as avaliações"   ON consultation_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1
              FROM public.user_roles
             WHERE user_roles.user_id = auth.uid()
               AND user_roles.role    = 'admin'
        )
    );
