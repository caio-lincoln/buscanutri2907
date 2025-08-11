-- Script de correções de segurança para execução manual
-- Gerado em: 2025-08-11T02:20:40.236Z
-- Execute este script no SQL Editor do Supabase Dashboard


-- 1. Otimizar política "Users can view consultation profiles" em telemedicine_consultations
-- Tipo: RLS Policy | Prioridade: Alta
DROP POLICY IF EXISTS "Users can view consultation profiles" ON public.telemedicine_consultations;
CREATE POLICY "Users can view consultation profiles" ON public.telemedicine_consultations
    FOR SELECT USING (
        (patient_id = (select auth.uid())) OR 
        (nutritionist_id = (select auth.uid()))
    );


-- 2. Otimizar política "Users can view own consultations" em telemedicine_consultations
-- Tipo: RLS Policy | Prioridade: Alta
DROP POLICY IF EXISTS "Users can view own consultations" ON public.telemedicine_consultations;
CREATE POLICY "Users can view own consultations" ON public.telemedicine_consultations
    FOR SELECT USING (
        (patient_id = (select auth.uid())) OR 
        (nutritionist_id = (select auth.uid()))
    );


-- 3. Otimizar política "Admin access to user roles" em user_roles
-- Tipo: RLS Policy | Prioridade: Alta
DROP POLICY IF EXISTS "Admin access to user roles" ON public.user_roles;
CREATE POLICY "Admin access to user roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = (select auth.uid())
            AND users.user_type = 'admin'::user_type
        )
    );


-- 4. Corrigir função increment_question_views com search_path fixo
-- Tipo: Function | Prioridade: Média
CREATE OR REPLACE FUNCTION public.increment_question_views(question_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE blog_questions 
    SET views = views + 1 
    WHERE id = question_id;
END;
$$;


-- 5. Corrigir função update_anamnese_updated_at com search_path fixo
-- Tipo: Function | Prioridade: Média
CREATE OR REPLACE FUNCTION public.update_anamnese_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- 6. Criar índice para consultation_messages.sender_id
-- Tipo: Index | Prioridade: Baixa
CREATE INDEX IF NOT EXISTS idx_consultation_messages_sender_id 
ON public.consultation_messages(sender_id);


-- 7. Criar índice para consultation_notes.author_id
-- Tipo: Index | Prioridade: Baixa
CREATE INDEX IF NOT EXISTS idx_consultation_notes_author_id 
ON public.consultation_notes(author_id);


-- Fim do script de correções
