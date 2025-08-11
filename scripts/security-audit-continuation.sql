-- Script de continuação da auditoria de segurança do Supabase
-- Este script corrige os problemas de RLS e funções identificados na auditoria

-- ============================================================================
-- CORREÇÃO DE POLÍTICAS RLS COM PROBLEMAS DE PERFORMANCE
-- Substituindo auth.uid() por (select auth.uid()) para melhor performance
-- ============================================================================

-- Tabela: telemedicine_consultations
DROP POLICY IF EXISTS "Users can view consultation profiles" ON public.telemedicine_consultations;
CREATE POLICY "Users can view consultation profiles" ON public.telemedicine_consultations
    FOR SELECT USING (
        (patient_id = (select auth.uid())) OR 
        (nutritionist_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "Users can view own consultations" ON public.telemedicine_consultations;
CREATE POLICY "Users can view own consultations" ON public.telemedicine_consultations
    FOR SELECT USING (
        (patient_id = (select auth.uid())) OR 
        (nutritionist_id = (select auth.uid()))
    );

-- Tabela: user_roles
DROP POLICY IF EXISTS "Admin access to user roles" ON public.user_roles;
CREATE POLICY "Admin access to user roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = (select auth.uid())
            AND users.user_type = 'admin'::user_type
        )
    );

-- Tabela: job_applications
DROP POLICY IF EXISTS "nutritionists_can_insert_own_applications" ON public.job_applications;
CREATE POLICY "nutritionists_can_insert_own_applications" ON public.job_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM nutritionist_profiles np
            WHERE np.user_id = (select auth.uid())
            AND np.id = job_applications.nutritionist_id
        )
    );

DROP POLICY IF EXISTS "nutritionists_can_view_own_applications" ON public.job_applications;
CREATE POLICY "nutritionists_can_view_own_applications" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM nutritionist_profiles np
            WHERE np.user_id = (select auth.uid())
            AND np.id = job_applications.nutritionist_id
        )
    );

DROP POLICY IF EXISTS "nutritionists_can_update_own_applications" ON public.job_applications;
CREATE POLICY "nutritionists_can_update_own_applications" ON public.job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM nutritionist_profiles np
            WHERE np.user_id = (select auth.uid())
            AND np.id = job_applications.nutritionist_id
        )
    );

-- ============================================================================
-- CORREÇÃO DE FUNÇÕES COM SEARCH_PATH MUTÁVEL
-- Adicionando SET search_path = public e SECURITY DEFINER
-- ============================================================================

-- Função: increment_question_views
DROP FUNCTION IF EXISTS public.increment_question_views(uuid);
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

-- Função: update_anamnese_updated_at
DROP FUNCTION IF EXISTS public.update_anamnese_updated_at();
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

-- Função: get_platform_stats
DROP FUNCTION IF EXISTS public.get_platform_stats();
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users),
        'total_nutritionists', (SELECT COUNT(*) FROM nutritionist_profiles),
        'total_patients', (SELECT COUNT(*) FROM patient_profiles),
        'total_companies', (SELECT COUNT(*) FROM company_profiles),
        'total_appointments', (SELECT COUNT(*) FROM appointments),
        'total_consultations', (SELECT COUNT(*) FROM telemedicine_consultations)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Função: get_company_overview_data
DROP FUNCTION IF EXISTS public.get_company_overview_data(uuid);
CREATE OR REPLACE FUNCTION public.get_company_overview_data(company_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'company_id', cp.id,
        'company_name', cp.company_name,
        'total_jobs', (SELECT COUNT(*) FROM jobs WHERE company_id = cp.id),
        'total_applications', (
            SELECT COUNT(*) FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            WHERE j.company_id = cp.id
        )
    ) INTO result
    FROM company_profiles cp
    WHERE cp.user_id = company_uuid;
    
    RETURN result;
END;
$$;

-- Função: calculate_consultation_price
DROP FUNCTION IF EXISTS public.calculate_consultation_price(text, text, uuid);
CREATE OR REPLACE FUNCTION public.calculate_consultation_price(
    modality text,
    consultation_type text,
    nutritionist_uuid uuid
)
RETURNS decimal
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    base_price decimal := 100.00;
    final_price decimal;
BEGIN
    -- Lógica básica de cálculo de preço
    final_price := base_price;
    
    -- Ajustar preço baseado na modalidade
    IF modality = 'online' THEN
        final_price := final_price * 0.9; -- 10% desconto para online
    END IF;
    
    -- Ajustar preço baseado no tipo de consulta
    IF consultation_type = 'follow_up' THEN
        final_price := final_price * 0.8; -- 20% desconto para retorno
    END IF;
    
    RETURN final_price;
END;
$$;

-- ============================================================================
-- ADIÇÃO DE ÍNDICES PARA CHAVES ESTRANGEIRAS ÓRFÃS
-- Melhorando performance de consultas
-- ============================================================================

-- Índice para consultation_messages.sender_id (se não existir)
CREATE INDEX IF NOT EXISTS idx_consultation_messages_sender_id 
ON public.consultation_messages(sender_id);

-- Índice para consultation_notes.author_id (se não existir)
CREATE INDEX IF NOT EXISTS idx_consultation_notes_author_id 
ON public.consultation_notes(author_id);

-- ============================================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON POLICY "Users can view consultation profiles" ON public.telemedicine_consultations 
IS 'Política RLS otimizada com (select auth.uid()) para melhor performance';

COMMENT ON POLICY "Users can view own consultations" ON public.telemedicine_consultations 
IS 'Política RLS otimizada com (select auth.uid()) para melhor performance';

COMMENT ON POLICY "Admin access to user roles" ON public.user_roles 
IS 'Política RLS otimizada com (select auth.uid()) para melhor performance';

COMMENT ON FUNCTION public.increment_question_views(uuid) 
IS 'Função com search_path fixo e SECURITY DEFINER para melhor segurança';

COMMENT ON FUNCTION public.update_anamnese_updated_at() 
IS 'Função com search_path fixo e SECURITY DEFINER para melhor segurança';

COMMENT ON FUNCTION public.get_platform_stats() 
IS 'Função com search_path fixo e SECURITY DEFINER para melhor segurança';

COMMENT ON FUNCTION public.get_company_overview_data(uuid) 
IS 'Função com search_path fixo e SECURITY DEFINER para melhor segurança';

COMMENT ON FUNCTION public.calculate_consultation_price(text, text, uuid) 
IS 'Função com search_path fixo e SECURITY DEFINER para melhor segurança';

-- ============================================================================
-- FIM DO SCRIPT DE AUDITORIA DE SEGURANÇA
-- ============================================================================