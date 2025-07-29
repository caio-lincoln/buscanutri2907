-- Políticas para tabela users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para nutritionist_profiles
DROP POLICY IF EXISTS "Nutritionists can view own profile" ON public.nutritionist_profiles;
DROP POLICY IF EXISTS "Nutritionists can insert own profile" ON public.nutritionist_profiles;
DROP POLICY IF EXISTS "Nutritionists can update own profile" ON public.nutritionist_profiles;
DROP POLICY IF EXISTS "Anyone can view approved nutritionists" ON public.nutritionist_profiles;

CREATE POLICY "Nutritionists can view own profile" ON public.nutritionist_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Nutritionists can insert own profile" ON public.nutritionist_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Nutritionists can update own profile" ON public.nutritionist_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved nutritionists" ON public.nutritionist_profiles
  FOR SELECT USING (verification_status = 'aprovado');

-- Políticas para patient_profiles
DROP POLICY IF EXISTS "Patients can view own profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can insert own profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can update own profile" ON public.patient_profiles;

CREATE POLICY "Patients can view own profile" ON public.patient_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert own profile" ON public.patient_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can update own profile" ON public.patient_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para company_profiles
DROP POLICY IF EXISTS "Companies can view own profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Companies can insert own profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Companies can update own profile" ON public.company_profiles;
-- NOVA POLÍTICA: Permite que qualquer pessoa visualize perfis de empresas
DROP POLICY IF EXISTS "Anyone can view company profiles" ON public.company_profiles;

CREATE POLICY "Companies can view own profile" ON public.company_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert own profile" ON public.company_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can update own profile" ON public.company_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view company profiles" ON public.company_profiles
  FOR SELECT USING (true);
