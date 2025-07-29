-- Habilitar RLS nas tabelas
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_processes ENABLE ROW LEVEL SECURITY;

-- Políticas para job_postings
DROP POLICY IF EXISTS "Empresas podem ver suas próprias vagas" ON public.job_postings;
CREATE POLICY "Empresas podem ver suas próprias vagas" ON public.job_postings
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.company_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Empresas podem criar vagas" ON public.job_postings;
CREATE POLICY "Empresas podem criar vagas" ON public.job_postings
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM public.company_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Empresas podem atualizar suas vagas" ON public.job_postings;
CREATE POLICY "Empresas podem atualizar suas vagas" ON public.job_postings
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM public.company_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Empresas podem deletar suas vagas" ON public.job_postings;
CREATE POLICY "Empresas podem deletar suas vagas" ON public.job_postings
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM public.company_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Nutricionistas podem ver vagas ativas" ON public.job_postings;
CREATE POLICY "Nutricionistas podem ver vagas ativas" ON public.job_postings
    FOR SELECT USING (
        status = 'ativa' AND 
        EXISTS (
            SELECT 1 FROM public.nutritionist_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Políticas para job_applications
DROP POLICY IF EXISTS "Empresas podem ver candidaturas de suas vagas" ON public.job_applications;
CREATE POLICY "Empresas podem ver candidaturas de suas vagas" ON public.job_applications
    FOR SELECT USING (
        job_id IN (
            SELECT jp.id FROM public.job_postings jp
            JOIN public.company_profiles cp ON jp.company_id = cp.id
            WHERE cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Nutricionistas podem ver suas candidaturas" ON public.job_applications;
CREATE POLICY "Nutricionistas podem ver suas candidaturas" ON public.job_applications
    FOR SELECT USING (
        candidate_id IN (
            SELECT id FROM public.nutritionist_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Nutricionistas podem criar candidaturas" ON public.job_applications;
CREATE POLICY "Nutricionistas podem criar candidaturas" ON public.job_applications
    FOR INSERT WITH CHECK (
        candidate_id IN (
            SELECT id FROM public.nutritionist_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Empresas podem atualizar status de candidaturas" ON public.job_applications;
CREATE POLICY "Empresas podem atualizar status de candidaturas" ON public.job_applications
    FOR UPDATE USING (
        job_id IN (
            SELECT jp.id FROM public.job_postings jp
            JOIN public.company_profiles cp ON jp.company_id = cp.id
            WHERE cp.user_id = auth.uid()
        )
    );

-- Políticas para selection_processes
DROP POLICY IF EXISTS "Empresas podem gerenciar processos seletivos" ON public.selection_processes;
CREATE POLICY "Empresas podem gerenciar processos seletivos" ON public.selection_processes
    FOR ALL USING (
        application_id IN (
            SELECT ja.id FROM public.job_applications ja
            JOIN public.job_postings jp ON ja.job_id = jp.id
            JOIN public.company_profiles cp ON jp.company_id = cp.id
            WHERE cp.user_id = auth.uid()
        )
    );
