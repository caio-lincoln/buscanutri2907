-- Inserir dados de exemplo para empresa (assumindo que existe uma empresa com ID específico)
-- Primeiro, vamos criar uma empresa de exemplo se não existir

-- Inserir usuário empresa de exemplo
INSERT INTO public.users (id, email, user_type) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'empresa@exemplo.com', 'empresa')
ON CONFLICT (id) DO NOTHING;

-- Inserir perfil da empresa
INSERT INTO public.company_profiles (
  id, user_id, company_name, cnpj, responsible_name, responsible_position, 
  phone, company_size, industry, description
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  'NutriCorp Saúde',
  '12.345.678/0001-90',
  'João Silva',
  'Diretor de RH',
  '(11) 3333-4444',
  'Médio (51-200)',
  'Saúde',
  'Empresa líder em soluções de nutrição e saúde, com mais de 10 anos de experiência no mercado.'
) ON CONFLICT (id) DO NOTHING;

-- Inserir algumas vagas de exemplo
INSERT INTO public.job_postings (
  company_id, title, description, requirements, benefits, location, 
  job_type, level, salary_min, salary_max, status
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Nutricionista Clínico',
  'Buscamos nutricionista experiente para atendimento clínico em nossa unidade. Responsável por consultas, elaboração de planos alimentares e acompanhamento de pacientes.',
  ARRAY['CRN ativo', 'Experiência mínima de 3 anos', 'Conhecimento em nutrição clínica'],
  ARRAY['Vale alimentação', 'Plano de saúde', 'Vale transporte', 'Participação nos lucros'],
  'São Paulo, SP',
  'CLT',
  'Pleno',
  4500,
  6000
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Nutricionista Esportivo',
  'Oportunidade para nutricionista especializado em esportes para atuar em nossa academia parceira. Foco em atletas de alto rendimento.',
  ARRAY['CRN ativo', 'Especialização em Nutrição Esportiva', 'Experiência com atletas'],
  ARRAY['Comissão por consulta', 'Flexibilidade de horários', 'Ambiente moderno'],
  'Rio de Janeiro, RJ',
  'PJ',
  'Sênior',
  5000,
  8000
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Coordenador de Nutrição',
  'Vaga para coordenação de equipe de nutricionistas em nossa rede de clínicas. Responsável por gestão de equipe e padronização de processos.',
  ARRAY['CRN ativo', 'Experiência em gestão', 'Conhecimento em food service'],
  ARRAY['Salário competitivo', 'Participação nos lucros', 'Carro da empresa'],
  'Belo Horizonte, MG',
  'CLT',
  'Gerente',
  7000,
  10000
);

-- Inserir alguns nutricionistas de exemplo para candidaturas
INSERT INTO public.users (id, email, user_type) VALUES 
('550e8400-e29b-41d4-a716-446655440003', 'ana.silva@email.com', 'nutricionista'),
('550e8400-e29b-41d4-a716-446655440004', 'carlos.santos@email.com', 'nutricionista'),
('550e8400-e29b-41d4-a716-446655440005', 'maria.oliveira@email.com', 'nutricionista')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.nutritionist_profiles (
  id, user_id, full_name, crn, phone, bio, verification_status, trust_seal, rating, total_reviews
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440003',
  'Ana Silva',
  'CRN3 12345',
  '(11) 99999-9999',
  'Nutricionista clínica com 5 anos de experiência em atendimento hospitalar.',
  'aprovado',
  true,
  4.8,
  45
),
(
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440004',
  'Carlos Santos',
  'CRN3 54321',
  '(21) 88888-8888',
  'Especialista em nutrição esportiva com experiência em atletas de alto rendimento.',
  'aprovado',
  true,
  4.9,
  67
),
(
  '550e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440005',
  'Maria Oliveira',
  'CRN3 67890',
  '(31) 77777-7777',
  'Nutricionista com 8 anos de experiência e especialização em gestão.',
  'aprovado',
  true,
  4.7,
  89
);

-- Inserir candidaturas de exemplo
INSERT INTO public.job_applications (job_id, candidate_id, status, cover_letter) 
SELECT 
  jp.id,
  np.id,
  CASE 
    WHEN random() < 0.3 THEN 'pendente'
    WHEN random() < 0.6 THEN 'em_analise'
    WHEN random() < 0.8 THEN 'aprovado'
    ELSE 'entrevista'
  END,
  'Tenho grande interesse na vaga e acredito que minha experiência pode contribuir significativamente para a equipe.'
FROM public.job_postings jp
CROSS JOIN public.nutritionist_profiles np
WHERE jp.company_id = '550e8400-e29b-41d4-a716-446655440002'
AND np.id IN ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008');

-- Inserir processos seletivos
INSERT INTO public.selection_processes (application_id, current_stage, next_step, deadline, status)
SELECT 
  ja.id,
  CASE 
    WHEN ja.status = 'em_analise' THEN 'Análise de Currículo'
    WHEN ja.status = 'aprovado' THEN 'Entrevista Inicial'
    WHEN ja.status = 'entrevista' THEN 'Entrevista Técnica'
    ELSE 'Triagem'
  END,
  CASE 
    WHEN ja.status = 'em_analise' THEN 'Entrevista Inicial'
    WHEN ja.status = 'aprovado' THEN 'Entrevista Técnica'
    WHEN ja.status = 'entrevista' THEN 'Proposta'
    ELSE 'Análise de Currículo'
  END,
  CURRENT_DATE + INTERVAL '7 days',
  'em_andamento'
FROM public.job_applications ja
WHERE ja.status IN ('em_analise', 'aprovado', 'entrevista');

-- Inserir estatísticas da empresa
INSERT INTO public.company_stats (
  company_id, total_jobs, active_jobs, total_applications, hired_candidates,
  conversion_rate, avg_hiring_time, cost_per_hire, candidate_satisfaction
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  3,
  3,
  9,
  2,
  22.2,
  18,
  1250,
  4.7
) ON CONFLICT (company_id) DO UPDATE SET
  total_jobs = EXCLUDED.total_jobs,
  active_jobs = EXCLUDED.active_jobs,
  total_applications = EXCLUDED.total_applications,
  hired_candidates = EXCLUDED.hired_candidates,
  conversion_rate = EXCLUDED.conversion_rate,
  avg_hiring_time = EXCLUDED.avg_hiring_time,
  cost_per_hire = EXCLUDED.cost_per_hire,
  candidate_satisfaction = EXCLUDED.candidate_satisfaction,
  updated_at = now();
