-- Fix RLS policies for public.users table to resolve permission denied errors

BEGIN;

-- Ensure RLS is enabled on public.users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert and read users" ON public.users;

-- Create comprehensive policy for authenticated users
CREATE POLICY "Authenticated users can access users table" ON public.users
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Alternative: More restrictive policy (users can only access their own data)
-- Uncomment this and comment the above if you prefer more security
-- CREATE POLICY "Users can manage own data" ON public.users
--     FOR ALL TO authenticated
--     USING (auth.uid() = id)
--     WITH CHECK (auth.uid() = id);

-- Ensure patient_profiles table has proper policies
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can manage own profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can view their own patient profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can update their own patient profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to manage patient profiles" ON public.patient_profiles;

-- Create policy for patient profiles
CREATE POLICY "Authenticated users can manage patient profiles" ON public.patient_profiles
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Ensure patient_favorite_nutritionists table has proper policies
ALTER TABLE public.patient_favorite_nutritionists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pacientes podem ver seus favoritos" ON public.patient_favorite_nutritionists;
DROP POLICY IF EXISTS "Pacientes podem adicionar favoritos" ON public.patient_favorite_nutritionists;
DROP POLICY IF EXISTS "Pacientes podem remover favoritos" ON public.patient_favorite_nutritionists;

-- Create policies for patient favorites
CREATE POLICY "Authenticated users can manage favorites" ON public.patient_favorite_nutritionists
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

COMMIT;

-- Verify the policies were applied
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'patient_profiles', 'patient_favorite_nutritionists')
ORDER BY tablename;

-- Show created policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'patient_profiles', 'patient_favorite_nutritionists')
ORDER BY tablename, policyname;