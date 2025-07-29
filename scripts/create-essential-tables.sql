-- Verificar se as tabelas já existem antes de criar
DO $$ 
BEGIN
    -- Criar tabela job_postings se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_postings') THEN
        CREATE TABLE public.job_postings (
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
        
        -- Criar índices
        CREATE INDEX idx_job_postings_company_id ON public.job_postings(company_id);
        CREATE INDEX idx_job_postings_status ON public.job_postings(status);
    END IF;

    -- Criar tabela job_applications se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_applications') THEN
        CREATE TABLE public.job_applications (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            job_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE NOT NULL,
            candidate_id uuid REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE NOT NULL,
            status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'rejeitado', 'entrevista', 'contratado')) NOT NULL,
            cover_letter text,
            applied_at timestamp with time zone DEFAULT now() NOT NULL,
            updated_at timestamp with time zone DEFAULT now() NOT NULL,
            UNIQUE(job_id, candidate_id)
        );
        
        -- Criar índices
        CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
        CREATE INDEX idx_job_applications_candidate_id ON public.job_applications(candidate_id);
        CREATE INDEX idx_job_applications_status ON public.job_applications(status);
    END IF;

    -- Criar tabela selection_processes se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'selection_processes') THEN
        CREATE TABLE public.selection_processes (
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
        
        -- Criar índices
        CREATE INDEX idx_selection_processes_application_id ON public.selection_processes(application_id);
    END IF;
END $$;

-- Criar função para atualizar contador de candidaturas
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

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_update_applications_count ON public.job_applications;
CREATE TRIGGER trigger_update_applications_count
    AFTER INSERT OR DELETE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION update_applications_count();

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para updated_at
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
