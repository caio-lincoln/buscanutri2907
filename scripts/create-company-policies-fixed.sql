-- Habilitar RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para job_postings
DROP POLICY IF EXISTS "Companies can manage their own job postings" ON public.job_postings;
CREATE POLICY "Companies can manage their own job postings" ON public.job_postings
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.company_profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Nutritionists can view active job postings" ON public.job_postings;
CREATE POLICY "Nutritionists can view active job postings" ON public.job_postings
  FOR SELECT USING (status = 'ativa');

-- Políticas para job_applications
DROP POLICY IF EXISTS "Companies can view applications to their jobs" ON public.job_applications;
CREATE POLICY "Companies can view applications to their jobs" ON public.job_applications
  FOR ALL USING (
    job_id IN (
      SELECT id FROM public.job_postings 
      WHERE company_id IN (
        SELECT id FROM public.company_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Nutritionists can manage their own applications" ON public.job_applications;
CREATE POLICY "Nutritionists can manage their own applications" ON public.job_applications
  FOR ALL USING (
    candidate_id IN (
      SELECT id FROM public.nutritionist_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas para selection_processes
DROP POLICY IF EXISTS "Companies can manage selection processes" ON public.selection_processes;
CREATE POLICY "Companies can manage selection processes" ON public.selection_processes
  FOR ALL USING (
    application_id IN (
      SELECT ja.id FROM public.job_applications ja
      JOIN public.job_postings jp ON ja.job_id = jp.id
      WHERE jp.company_id IN (
        SELECT id FROM public.company_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Políticas para company_stats
DROP POLICY IF EXISTS "Companies can manage their own stats" ON public.company_stats;
CREATE POLICY "Companies can manage their own stats" ON public.company_stats
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.company_profiles 
      WHERE user_id = auth.uid()
    )
  );
