-- Script para corrigir os erros restantes
-- 1. Criar tabela consultation_reviews se não existir
-- 2. Corrigir políticas RLS para nutritionist_profiles

BEGIN;

-- ========== CRIAR TABELA CONSULTATION_REVIEWS ==========
CREATE TABLE IF NOT EXISTS consultation_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nutritionist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_consultation_reviews_consultation_id ON consultation_reviews(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_reviews_patient_id ON consultation_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_reviews_nutritionist_id ON consultation_reviews(nutritionist_id);

-- Habilitar RLS
ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;

-- ========== POLÍTICAS PARA CONSULTATION_REVIEWS ==========
DROP POLICY IF EXISTS "Users can view reviews from their consultations" ON consultation_reviews;
CREATE POLICY "Users can view reviews from their consultations" ON consultation_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultations 
      WHERE consultations.id = consultation_reviews.consultation_id 
      AND (consultations.patient_id = auth.uid() OR consultations.nutritionist_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Patients can create reviews" ON consultation_reviews;
CREATE POLICY "Patients can create reviews" ON consultation_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = patient_id AND
    EXISTS (
      SELECT 1 FROM consultations 
      WHERE consultations.id = consultation_reviews.consultation_id 
      AND consultations.patient_id = auth.uid()
      AND consultations.status = 'completed'
    )
  );

DROP POLICY IF EXISTS "Patients can update their reviews" ON consultation_reviews;
CREATE POLICY "Patients can update their reviews" ON consultation_reviews
  FOR UPDATE USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can delete their reviews" ON consultation_reviews;
CREATE POLICY "Patients can delete their reviews" ON consultation_reviews
  FOR DELETE USING (auth.uid() = patient_id);

-- ========== CORRIGIR POLÍTICAS PARA NUTRITIONIST_PROFILES ==========
-- Permitir que pacientes vejam perfis de nutricionistas em suas consultas e favoritos
DROP POLICY IF EXISTS "Public can view nutritionist profiles" ON nutritionist_profiles;
DROP POLICY IF EXISTS "Users can view nutritionist profiles" ON nutritionist_profiles;
DROP POLICY IF EXISTS "Patients can view nutritionist profiles in favorites" ON nutritionist_profiles;

-- Política principal: permitir visualização pública de perfis de nutricionistas
CREATE POLICY "Public can view nutritionist profiles" ON nutritionist_profiles
  FOR SELECT USING (true);

-- Política para atualização: apenas o próprio nutricionista
DROP POLICY IF EXISTS "Users can update their own nutritionist profile" ON nutritionist_profiles;
CREATE POLICY "Users can update their own nutritionist profile" ON nutritionist_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para inserção: apenas o próprio nutricionista
DROP POLICY IF EXISTS "Users can insert their own nutritionist profile" ON nutritionist_profiles;
CREATE POLICY "Users can insert their own nutritionist profile" ON nutritionist_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========== VERIFICAR SE A FUNÇÃO GET_PATIENT_STATS EXISTE ==========
-- Recriar a função se necessário
CREATE OR REPLACE FUNCTION public.get_patient_stats(p_patient_id uuid)
RETURNS TABLE (
  total_consultations        integer,
  scheduled_consultations    integer,
  completed_consultations    integer,
  favorite_nutritionists     integer,
  average_rating             numeric(4,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Total
  SELECT COUNT(*) INTO total_consultations
    FROM public.consultations
   WHERE patient_id = p_patient_id;

  -- Agendadas no futuro
  SELECT COUNT(*) INTO scheduled_consultations
    FROM public.consultations
   WHERE patient_id = p_patient_id
     AND status = 'scheduled';

  -- Concluídas
  SELECT COUNT(*) INTO completed_consultations
    FROM public.consultations
   WHERE patient_id = p_patient_id
     AND status = 'completed';

  -- Favoritos
  SELECT COUNT(*) INTO favorite_nutritionists
    FROM public.patient_favorite_nutritionists
   WHERE patient_id = p_patient_id;

  -- Média de estrelas (pode ser NULL)
  SELECT COALESCE(AVG(rating), 0)::numeric(4,2) INTO average_rating
    FROM public.consultation_reviews
   WHERE patient_id = p_patient_id;

  RETURN NEXT;
END;
$$;

-- Permitir execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_patient_stats(uuid) TO authenticated;

COMMIT;

-- Verificar se as tabelas existem
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'Existe' ELSE 'Não existe' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('consultations', 'consultation_reviews', 'patient_favorite_nutritionists', 'nutritionist_profiles')
ORDER BY table_name;

-- Verificar RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'Habilitado' ELSE 'Desabilitado' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('consultations', 'consultation_reviews', 'patient_favorite_nutritionists', 'nutritionist_profiles')
ORDER BY tablename;