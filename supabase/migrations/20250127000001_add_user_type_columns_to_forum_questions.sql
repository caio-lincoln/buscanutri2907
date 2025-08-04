-- Adicionar colunas para identificar o tipo de usuário que criou a pergunta
-- Isso permitirá separar perguntas de pacientes e nutricionistas

-- Adicionar colunas opcionais para referenciar perfis específicos
ALTER TABLE public.forum_questions 
ADD COLUMN patient_id UUID REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
ADD COLUMN nutritionist_id UUID REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_forum_questions_patient_id ON public.forum_questions(patient_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_nutritionist_id ON public.forum_questions(nutritionist_id);

-- Adicionar constraint para garantir que apenas um dos IDs seja preenchido
ALTER TABLE public.forum_questions 
ADD CONSTRAINT chk_forum_questions_single_profile 
CHECK (
  (patient_id IS NOT NULL AND nutritionist_id IS NULL) OR 
  (patient_id IS NULL AND nutritionist_id IS NOT NULL)
);

-- Comentários para documentação
COMMENT ON COLUMN public.forum_questions.patient_id IS 'ID do perfil do paciente que criou a pergunta (mutuamente exclusivo com nutritionist_id)';
COMMENT ON COLUMN public.forum_questions.nutritionist_id IS 'ID do perfil do nutricionista que criou a pergunta (mutuamente exclusivo com patient_id)';