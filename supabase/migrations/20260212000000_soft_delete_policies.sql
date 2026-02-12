-- Migration: soft_delete_policies

-- 1. Add columns to tables that miss them
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE anamnese_nutricional 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Update Policies (Drop and Recreate to be safe and clean)

-- USERS
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (id = auth.uid() AND is_deleted = false);

DROP POLICY IF EXISTS "Public profiles are readable" ON users;
CREATE POLICY "Public profiles are readable" ON users FOR SELECT USING (is_deleted = false);

-- NUTRITIONIST_PROFILES
DROP POLICY IF EXISTS "Public can view all nutritionists" ON nutritionist_profiles;
CREATE POLICY "Public can view all nutritionists" ON nutritionist_profiles FOR SELECT USING (verification_status = ANY (ARRAY['aprovado'::verification_status, 'pendente'::verification_status]) AND is_deleted = false);

DROP POLICY IF EXISTS "View nutritionist profiles" ON nutritionist_profiles;
CREATE POLICY "View nutritionist profiles" ON nutritionist_profiles FOR SELECT USING ((verification_status = ANY (ARRAY['aprovado'::verification_status, 'pendente'::verification_status]) OR auth.uid() = user_id) AND is_deleted = false);

-- PATIENT_PROFILES
DROP POLICY IF EXISTS "Allow viewing patient profiles for forum context" ON patient_profiles;
CREATE POLICY "Allow viewing patient profiles for forum context" ON patient_profiles FOR SELECT USING (is_deleted = false);

DROP POLICY IF EXISTS "Users can view their own patient profile" ON patient_profiles;
CREATE POLICY "Users can view their own patient profile" ON patient_profiles FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

-- APPOINTMENTS
DROP POLICY IF EXISTS "appointments_select_authenticated" ON appointments;
CREATE POLICY "appointments_select_authenticated" ON appointments FOR SELECT USING (
  ((EXISTS ( SELECT 1 FROM patient_profiles p WHERE ((p.id = appointments.patient_id) AND (p.user_id = auth.uid())))) 
  OR (EXISTS ( SELECT 1 FROM nutritionist_profiles n WHERE ((n.id = appointments.nutritionist_id) AND (n.user_id = auth.uid())))))
  AND is_deleted = false
);

-- CONSULTATIONS
DROP POLICY IF EXISTS "Nutritionists can view their own consultations" ON consultations;
CREATE POLICY "Nutritionists can view their own consultations" ON consultations FOR SELECT USING (
  (nutritionist_id IN ( SELECT nutritionist_profiles.id FROM nutritionist_profiles WHERE (nutritionist_profiles.user_id = ( SELECT auth.uid() AS uid))))
  AND is_deleted = false
);

DROP POLICY IF EXISTS "Patients can view their own consultations" ON consultations;
CREATE POLICY "Patients can view their own consultations" ON consultations FOR SELECT USING (
  (patient_id IN ( SELECT patient_profiles.id FROM patient_profiles WHERE (patient_profiles.user_id = ( SELECT auth.uid() AS uid))))
  AND is_deleted = false
);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (
  ((EXISTS ( SELECT 1 FROM (chat_conversations c JOIN patient_profiles p ON ((p.id = c.patient_id))) WHERE ((c.id = chat_messages.conversation_id) AND (p.user_id = ( SELECT auth.uid() AS uid)) AND (c.is_deleted = false)))) 
  OR (EXISTS ( SELECT 1 FROM (chat_conversations c JOIN nutritionist_profiles n ON ((n.id = c.nutritionist_id))) WHERE ((c.id = chat_messages.conversation_id) AND (n.user_id = ( SELECT auth.uid() AS uid)) AND (c.is_deleted = false)))))
  AND is_deleted = false
);

-- PAYMENTS
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (
  (EXISTS ( SELECT 1 FROM user_profiles up WHERE ((up.id = auth.uid()) AND (up.user_type = 'admin'::user_type))))
  AND is_deleted = false
);

DROP POLICY IF EXISTS "Nutritionists can view payments for their consultations" ON payments;
CREATE POLICY "Nutritionists can view payments for their consultations" ON payments FOR SELECT USING (
  (nutritionist_id = auth.uid()) -- Preserving existing logic
  AND is_deleted = false
);

DROP POLICY IF EXISTS "Patients can view their own payments" ON payments;
CREATE POLICY "Patients can view their own payments" ON payments FOR SELECT USING (
  (patient_id = auth.uid()) -- Preserving existing logic
  AND is_deleted = false
);

-- USER_SUBSCRIPTIONS
DROP POLICY IF EXISTS "self can read own active sub" ON user_subscriptions;
CREATE POLICY "self can read own active sub" ON user_subscriptions FOR SELECT USING (
  (user_id = auth.uid())
  AND is_deleted = false
);

-- ANAMNESE_NUTRICIONAL
DROP POLICY IF EXISTS "Pacientes podem ver sua própria anamnese" ON anamnese_nutricional;
CREATE POLICY "Pacientes podem ver sua própria anamnese" ON anamnese_nutricional FOR SELECT USING (
  (( SELECT auth.uid() AS uid) = patient_id)
  AND is_deleted = false
);

DROP POLICY IF EXISTS "Nutricionistas podem ver anamnese durante consultas" ON anamnese_nutricional;
CREATE POLICY "Nutricionistas podem ver anamnese durante consultas" ON anamnese_nutricional FOR SELECT USING (
  (EXISTS ( SELECT 1 FROM consultations WHERE ((consultations.patient_id = anamnese_nutricional.patient_id) AND (consultations.nutritionist_id = ( SELECT auth.uid() AS uid)) AND ((consultations.status)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('in-progress'::character varying)::text, ('completed'::character varying)::text])))))
  AND is_deleted = false
);
