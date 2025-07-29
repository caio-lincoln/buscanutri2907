-- Habilitar RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para job_postings
DROP POLICY IF EXISTS "Companies can manage their own jobs" ON public.job_postings;
CREATE POLICY "Companies can manage their own jobs" ON public.job_postings
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.company_profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.job_postings;
CREATE POLICY "Anyone can view active jobs" ON public.job_postings
  FOR SELECT USING (status = 'ativa');

-- Políticas para job_applications
DROP POLICY IF EXISTS "Companies can view applications for their jobs" ON public.job_applications;
CREATE POLICY "Companies can view applications for their jobs" ON public.job_applications
  FOR SELECT USING (
    job_id IN (
      SELECT jp.id FROM public.job_postings jp
      JOIN public.company_profiles cp ON jp.company_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Companies can update applications for their jobs" ON public.job_applications;
CREATE POLICY "Companies can update applications for their jobs" ON public.job_applications
  FOR UPDATE USING (
    job_id IN (
      SELECT jp.id FROM public.job_postings jp
      JOIN public.company_profiles cp ON jp.company_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Nutritionists can apply to jobs" ON public.job_applications;
CREATE POLICY "Nutritionists can apply to jobs" ON public.job_applications
  FOR INSERT WITH CHECK (
    candidate_id IN (
      SELECT id FROM public.nutritionist_profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Nutritionists can view their own applications" ON public.job_applications;
CREATE POLICY "Nutritionists can view their own applications" ON public.job_applications
  FOR SELECT USING (
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
      JOIN public.company_profiles cp ON jp.company_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Políticas para company_stats
DROP POLICY IF EXISTS "Companies can view their own stats" ON public.company_stats;
CREATE POLICY "Companies can view their own stats" ON public.company_stats
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.company_profiles 
      WHERE user_id = auth.uid()
    )
  );
