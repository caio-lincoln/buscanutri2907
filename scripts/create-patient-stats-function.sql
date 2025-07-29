-- Função: public.get_patient_stats(uuid)
-- Calcula total de consultas, agendadas, concluídas, nutricionistas favoritos
--   e média de avaliações para um paciente.
-- Executada como SECURITY DEFINER para contornar RLS sem expor dados.

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
  SELECT AVG(rating)::numeric(4,2) INTO average_rating
    FROM public.consultation_reviews
   WHERE patient_id = p_patient_id;

  RETURN NEXT;
END;
$$;

-- Permite execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_patient_stats(uuid) TO authenticated;
