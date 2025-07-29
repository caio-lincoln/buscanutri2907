-- Verificar e corrigir configurações de autenticação
-- 1. Habilitar RLS nas tabelas principais
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritionist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes e criar novas mais permissivas
DROP POLICY IF EXISTS "Users can manage own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Política mais permissiva para users (permite inserção e leitura)
CREATE POLICY "Allow authenticated users to insert and read users" ON public.users
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para nutritionist_profiles
DROP POLICY IF EXISTS "Nutritionists can manage own profile" ON public.nutritionist_profiles;
CREATE POLICY "Allow authenticated users to manage nutritionist profiles" ON public.nutritionist_profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para patient_profiles
DROP POLICY IF EXISTS "Patients can manage own profile" ON public.patient_profiles;
CREATE POLICY "Allow authenticated users to manage patient profiles" ON public.patient_profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para company_profiles
DROP POLICY IF EXISTS "Companies can manage own profile" ON public.company_profiles;
CREATE POLICY "Allow authenticated users to manage company profiles" ON public.company_profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Verificar se as tabelas de perfil existem com as colunas corretas
-- Se não existirem, criar
CREATE TABLE IF NOT EXISTS public.nutritionist_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL,
  crn text NOT NULL,
  phone text,
  bio text,
  profile_image_url text,
  verification_status text DEFAULT 'pendente',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL,
  birth_date date,
  phone text,
  profile_image_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.company_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  company_name text NOT NULL,
  cnpj text NOT NULL,
  responsible_name text NOT NULL,
  responsible_position text,
  phone text,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
