-- Permitir avaliações diretas de pacientes para nutricionistas
ALTER TABLE public.consultation_reviews
  ALTER COLUMN consultation_id DROP NOT NULL;

ALTER TABLE public.consultation_reviews
  ADD COLUMN IF NOT EXISTS is_direct_rating boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Patients can create direct reviews" ON consultation_reviews;
CREATE POLICY "Patients can create direct reviews" ON consultation_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = patient_id AND
    consultation_id IS NULL AND
    is_direct_rating = true
  );

-- Simplificar visualização das avaliações: paciente ou nutricionista associados
DROP POLICY IF EXISTS "Users can view consultation reviews" ON consultation_reviews;
CREATE POLICY "Users can view consultation reviews" ON consultation_reviews
  FOR SELECT USING (
    auth.uid() = patient_id OR auth.uid() = nutritionist_id
  );
