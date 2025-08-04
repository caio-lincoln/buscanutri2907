-- Adicionar colunas para identificar o tipo de usuário que criou a resposta
-- Isso permitirá separar respostas de pacientes e nutricionistas

-- Adicionar colunas opcionais para referenciar perfis específicos
ALTER TABLE public.forum_answers 
ADD COLUMN patient_id UUID REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
ADD COLUMN nutritionist_id UUID REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_forum_answers_patient_id ON public.forum_answers(patient_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_nutritionist_id ON public.forum_answers(nutritionist_id);

-- Adicionar constraint para garantir que apenas um dos IDs seja preenchido
ALTER TABLE public.forum_answers 
ADD CONSTRAINT chk_forum_answers_single_profile 
CHECK (
  (patient_id IS NOT NULL AND nutritionist_id IS NULL) OR 
  (patient_id IS NULL AND nutritionist_id IS NOT NULL)
);

-- Comentários para documentação
COMMENT ON COLUMN public.forum_answers.patient_id IS 'ID do perfil do paciente que criou a resposta (mutuamente exclusivo com nutritionist_id)';
COMMENT ON COLUMN public.forum_answers.nutritionist_id IS 'ID do perfil do nutricionista que criou a resposta (mutuamente exclusivo com patient_id)';