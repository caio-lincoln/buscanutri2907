-- Migração para atualizar especialidades com a nova taxonomia
-- Data: 2024-12-01

-- Limpar dados antigos da tabela de especialidades (manter estrutura)
DELETE FROM public.nutritionist_specialties;
DELETE FROM public.specialties;

-- Inserir as novas especialidades em ordem alfabética
INSERT INTO public.specialties (name, description) VALUES
('Educação alimentar e nutricional', 'Especialização em educação alimentar e nutricional'),
('Gestão de políticas públicas e programas em alimentação e nutrição', 'Especialização em gestão de políticas públicas e programas em alimentação e nutrição'),
('Nutrição clínica', 'Especialização em nutrição clínica'),
('Nutrição clínica em cardiologia', 'Especialização em nutrição clínica aplicada à cardiologia'),
('Nutrição clínica em cuidados paliativos', 'Especialização em nutrição clínica para cuidados paliativos'),
('Nutrição clínica em doenças crônicas', 'Especialização em nutrição clínica para doenças crônicas'),
('Nutrição clínica em endocrinologia e metabologia', 'Especialização em nutrição clínica aplicada à endocrinologia e metabologia'),
('Nutrição clínica em gastroenterologia', 'Especialização em nutrição clínica aplicada à gastroenterologia'),
('Nutrição clínica em gerontologia', 'Especialização em nutrição clínica aplicada à gerontologia'),
('Nutrição clínica em nefrologia', 'Especialização em nutrição clínica aplicada à nefrologia'),
('Nutrição clínica em oncologia', 'Especialização em nutrição clínica aplicada à oncologia'),
('Nutrição clínica em terapia intensiva', 'Especialização em nutrição clínica para terapia intensiva'),
('Nutrição de precisão', 'Especialização em nutrição de precisão'),
('Nutrição e alimentos funcionais', 'Especialização em nutrição e alimentos funcionais'),
('Nutrição e fitoterapia', 'Especialização em nutrição e fitoterapia'),
('Nutrição em alimentação coletiva', 'Especialização em nutrição em alimentação coletiva'),
('Nutrição em alimentação coletiva hospitalar', 'Especialização em nutrição em alimentação coletiva hospitalar'),
('Nutrição em alimentação escolar', 'Especialização em nutrição em alimentação escolar'),
('Nutrição em atenção primária e saúde da família e comunidade', 'Especialização em nutrição em atenção primária e saúde da família e comunidade'),
('Nutrição em esportes e exercício físico', 'Especialização em nutrição em esportes e exercício físico'),
('Nutrição em estética', 'Especialização em nutrição em estética'),
('Nutrição em marketing', 'Especialização em nutrição em marketing'),
('Nutrição em saúde coletiva', 'Especialização em nutrição em saúde coletiva'),
('Nutrição em saúde da mulher', 'Especialização em nutrição em saúde da mulher'),
('Nutrição em saúde de povos e comunidades tradicionais', 'Especialização em nutrição em saúde de povos e comunidades tradicionais'),
('Nutrição em saúde indígena', 'Especialização em nutrição em saúde indígena'),
('Nutrição em saúde mental', 'Especialização em nutrição em saúde mental'),
('Nutrição em TEA (Transtorno do Espectro Autista)', 'Especialização em nutrição em TEA (Transtorno do Espectro Autista)'),
('Nutrição em TDAH (Transtorno do Déficit de Atenção e Hiperatividade)', 'Especialização em nutrição em TDAH (Transtorno do Déficit de Atenção e Hiperatividade)'),
('Nutrição em transtornos alimentares', 'Especialização em nutrição em transtornos alimentares'),
('Nutrição em vegetarianismo e veganismo', 'Especialização em nutrição em vegetarianismo e veganismo'),
('Nutrição integrativa', 'Especialização em nutrição integrativa'),
('Nutrição materno-infantil', 'Especialização em nutrição materno-infantil'),
('Nutrição na produção de refeições comerciais', 'Especialização em nutrição na produção de refeições comerciais'),
('Nutrição na produção da tecnologia de alimentos e bebidas', 'Especialização em nutrição na produção da tecnologia de alimentos e bebidas'),
('Qualidade e segurança dos alimentos', 'Especialização em qualidade e segurança dos alimentos'),
('Segurança alimentar e nutricional', 'Especialização em segurança alimentar e nutricional'),
('Terapia de nutrição enteral e parenteral (TEP)', 'Especialização em terapia de nutrição enteral e parenteral (TEP)'),
('Unidade de alimentação e nutrição (UAN)', 'Especialização em unidade de alimentação e nutrição (UAN)');

-- Comentário sobre a migração
COMMENT ON TABLE public.specialties IS 'Especialidades atualizadas com a nova taxonomia definida pelo negócio em ordem alfabética';