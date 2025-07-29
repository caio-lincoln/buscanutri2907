-- Inserir algumas vagas de exemplo (apenas se houver empresas)
DO $$
DECLARE
    company_record RECORD;
BEGIN
    -- Para cada empresa existente, criar algumas vagas de exemplo
    FOR company_record IN SELECT id FROM public.company_profiles LIMIT 3
    LOOP
        -- Inserir vagas de exemplo
        INSERT INTO public.job_postings (
            company_id,
            title,
            description,
            requirements,
            benefits,
            location,
            job_type,
            level,
            salary_min,
            salary_max,
            status
        ) VALUES 
        (
            company_record.id,
            'Nutricionista Clínico',
            'Buscamos nutricionista experiente para atendimento clínico em consultório. Responsável por consultas, elaboração de planos alimentares e acompanhamento de pacientes.',
            ARRAY['CRN ativo', 'Experiência mínima de 2 anos', 'Conhecimento em nutrição clínica'],
            ARRAY['Vale alimentação', 'Plano de saúde', 'Vale transporte'],
            'São Paulo, SP',
            'CLT',
            'Pleno',
            4500,
            6000,
            'ativa'
        ),
        (
            company_record.id,
            'Nutricionista Esportivo',
            'Oportunidade para nutricionista especializado em nutrição esportiva. Trabalho com atletas e praticantes de atividade física.',
            ARRAY['CRN ativo', 'Especialização em nutrição esportiva', 'Experiência com atletas'],
            ARRAY['Vale alimentação', 'Plano de saúde', 'Participação nos lucros'],
            'Rio de Janeiro, RJ',
            'PJ',
            'Sênior',
            5000,
            8000,
            'ativa'
        ),
        (
            company_record.id,
            'Coordenador de Nutrição',
            'Vaga para coordenação de equipe de nutricionistas em hospital. Responsável pela gestão da equipe e padronização de processos.',
            ARRAY['CRN ativo', 'Experiência em gestão', 'Conhecimento hospitalar'],
            ARRAY['Vale alimentação', 'Plano de saúde', 'Vale transporte', 'Auxílio educação'],
            'Belo Horizonte, MG',
            'CLT',
            'Gerente',
            7000,
            10000,
            'pausada'
        );
    END LOOP;
END $$;

-- Atualizar estatísticas das empresas
INSERT INTO public.company_stats (
    company_id,
    total_jobs,
    active_jobs,
    total_applications,
    hired_candidates,
    conversion_rate,
    avg_hiring_time,
    cost_per_hire,
    candidate_satisfaction
)
SELECT 
    cp.id,
    COALESCE(job_counts.total, 0),
    COALESCE(job_counts.active, 0),
    0, -- será atualizado quando houver candidaturas
    0, -- será atualizado quando houver contratações
    0, -- será calculado automaticamente
    18, -- valor padrão
    1250, -- valor padrão
    4.7 -- valor padrão
FROM public.company_profiles cp
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ativa') as active
    FROM public.job_postings
    GROUP BY company_id
) job_counts ON cp.id = job_counts.company_id
ON CONFLICT (company_id) DO UPDATE SET
    total_jobs = EXCLUDED.total_jobs,
    active_jobs = EXCLUDED.active_jobs,
    updated_at = now();
