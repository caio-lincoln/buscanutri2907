-- Inserir dados de exemplo apenas se não existirem

-- Inserir vagas de exemplo
INSERT INTO public.job_postings (company_id, title, description, location, job_type, level, salary_min, salary_max, requirements, benefits, status)
SELECT 
    cp.id,
    'Nutricionista Clínico',
    'Buscamos nutricionista experiente para atendimento clínico em nossa clínica. Responsável por consultas, elaboração de planos alimentares e acompanhamento de pacientes.',
    'São Paulo, SP',
    'CLT',
    'Pleno',
    4500,
    6500,
    ARRAY['CRN ativo', 'Experiência mínima de 3 anos', 'Conhecimento em nutrição clínica'],
    ARRAY['Vale alimentação', 'Plano de saúde', 'Vale transporte'],
    'ativa'
FROM public.company_profiles cp
WHERE NOT EXISTS (
    SELECT 1 FROM public.job_postings jp 
    WHERE jp.company_id = cp.id AND jp.title = 'Nutricionista Clínico'
)
LIMIT 1;

INSERT INTO public.job_postings (company_id, title, description, location, job_type, level, salary_min, salary_max, requirements, benefits, status)
SELECT 
    cp.id,
    'Nutricionista Esportivo',
    'Oportunidade para nutricionista especializado em nutrição esportiva. Trabalho com atletas e praticantes de atividade física.',
    'Rio de Janeiro, RJ',
    'PJ',
    'Sênior',
    6000,
    9000,
    ARRAY['CRN ativo', 'Especialização em nutrição esportiva', 'Experiência com atletas'],
    ARRAY['Horário flexível', 'Trabalho remoto parcial', 'Participação nos lucros'],
    'ativa'
FROM public.company_profiles cp
WHERE NOT EXISTS (
    SELECT 1 FROM public.job_postings jp 
    WHERE jp.company_id = cp.id AND jp.title = 'Nutricionista Esportivo'
)
LIMIT 1;

INSERT INTO public.job_postings (company_id, title, description, location, job_type, level, salary_min, salary_max, requirements, benefits, status)
SELECT 
    cp.id,
    'Coordenador de Nutrição',
    'Vaga para coordenação de equipe de nutricionistas. Responsável pela gestão da equipe e supervisão dos atendimentos.',
    'Belo Horizonte, MG',
    'CLT',
    'Gerente',
    8000,
    12000,
    ARRAY['CRN ativo', 'Experiência em gestão', 'Pós-graduação em nutrição'],
    ARRAY['Vale alimentação', 'Plano de saúde', 'Carro da empresa'],
    'pausada'
FROM public.company_profiles cp
WHERE NOT EXISTS (
    SELECT 1 FROM public.job_postings jp 
    WHERE jp.company_id = cp.id AND jp.title = 'Coordenador de Nutrição'
)
LIMIT 1;

-- Inserir candidaturas de exemplo (apenas se existirem nutricionistas)
INSERT INTO public.job_applications (job_id, candidate_id, status, cover_letter)
SELECT 
    jp.id,
    np.id,
    'em_analise',
    'Tenho grande interesse na vaga de ' || jp.title || '. Possuo experiência na área e acredito que posso contribuir significativamente para a equipe.'
FROM public.job_postings jp
CROSS JOIN public.nutritionist_profiles np
WHERE jp.title = 'Nutricionista Clínico'
AND NOT EXISTS (
    SELECT 1 FROM public.job_applications ja 
    WHERE ja.job_id = jp.id AND ja.candidate_id = np.id
)
LIMIT 3;

INSERT INTO public.job_applications (job_id, candidate_id, status, cover_letter)
SELECT 
    jp.id,
    np.id,
    'aprovado',
    'Sou especialista em nutrição esportiva e tenho experiência com atletas de alto rendimento.'
FROM public.job_postings jp
CROSS JOIN public.nutritionist_profiles np
WHERE jp.title = 'Nutricionista Esportivo'
AND NOT EXISTS (
    SELECT 1 FROM public.job_applications ja 
    WHERE ja.job_id = jp.id AND ja.candidate_id = np.id
)
LIMIT 2;

-- Inserir processos seletivos de exemplo
INSERT INTO public.selection_processes (application_id, current_stage, next_step, deadline, status, notes)
SELECT 
    ja.id,
    'Análise de Currículo',
    'Entrevista Inicial',
    CURRENT_DATE + INTERVAL '7 days',
    'em_andamento',
    'Candidato com perfil interessante, agendar entrevista.'
FROM public.job_applications ja
WHERE ja.status = 'em_analise'
AND NOT EXISTS (
    SELECT 1 FROM public.selection_processes sp 
    WHERE sp.application_id = ja.id
)
LIMIT 2;

INSERT INTO public.selection_processes (application_id, current_stage, next_step, deadline, status, notes)
SELECT 
    ja.id,
    'Proposta Enviada',
    'Aguardando Resposta',
    CURRENT_DATE + INTERVAL '5 days',
    'em_andamento',
    'Proposta salarial enviada, aguardando retorno do candidato.'
FROM public.job_applications ja
WHERE ja.status = 'aprovado'
AND NOT EXISTS (
    SELECT 1 FROM public.selection_processes sp 
    WHERE sp.application_id = ja.id
)
LIMIT 1;
