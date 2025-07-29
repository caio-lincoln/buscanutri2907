-- Tabela de vagas
CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  requirements text[] DEFAULT '{}',
  benefits text[] DEFAULT '{}',
  location text NOT NULL,
  job_type text CHECK (job_type IN ('CLT', 'PJ', 'Estágio', 'Freelancer')) NOT NULL,
  level text CHECK (level IN ('Estagiário', 'Júnior', 'Pleno', 'Sênior', 'Gerente')) NOT NULL,
  salary_min numeric,
  salary_max numeric,
  status text DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'fechada')),
  applications_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela de candidaturas
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'rejeitado', 'entrevista', 'contratado')) NOT NULL,
  cover_letter text,
  applied_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela de processos seletivos
CREATE TABLE IF NOT EXISTS public.selection_processes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.job_applications(id) ON DELETE CASCADE NOT NULL,
  current_stage text NOT NULL,
  next_step text,
  deadline date,
  notes text,
  status text DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'pausado', 'concluido', 'cancelado')) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela de estatísticas da empresa
CREATE TABLE IF NOT EXISTS public.company_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE NOT NULL,
  total_jobs integer DEFAULT 0,
  active_jobs integer DEFAULT 0,
  total_applications integer DEFAULT 0,
  hired_candidates integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  avg_hiring_time integer DEFAULT 0,
  cost_per_hire numeric DEFAULT 0,
  candidate_satisfaction numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(company_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON public.job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_id ON public.job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_selection_processes_application_id ON public.selection_processes(application_id);

-- Trigger para atualizar contador de candidaturas
CREATE OR REPLACE FUNCTION update_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_postings 
    SET applications_count = applications_count + 1 
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_postings 
    SET applications_count = applications_count - 1 
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_applications_count ON public.job_applications;
CREATE TRIGGER trigger_update_applications_count
  AFTER INSERT OR DELETE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION update_applications_count();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_postings_updated_at ON public.job_postings;
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_selection_processes_updated_at ON public.selection_processes;
CREATE TRIGGER update_selection_processes_updated_at
  BEFORE UPDATE ON public.selection_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
