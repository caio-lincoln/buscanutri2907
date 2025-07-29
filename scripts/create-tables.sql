-- Criar tabela users (se não existir)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  user_type text CHECK (user_type IN ('paciente', 'nutricionista', 'empresa', 'admin')) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar tabela nutritionist_profiles (se não existir)
CREATE TABLE IF NOT EXISTS public.nutritionist_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  crn text NOT NULL,
  phone text,
  bio text,
  profile_image_url text,
  verification_status text DEFAULT 'pendente' CHECK (verification_status IN ('pendente', 'aprovado', 'rejeitado')),
  trust_seal boolean DEFAULT false,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  consultation_price numeric,
  online_consultation_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar tabela patient_profiles (se não existir)
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  birth_date date,
  phone text,
  profile_image_url text,
  health_conditions text[],
  allergies text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar tabela company_profiles (se não existir)
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  cnpj text NOT NULL,
  responsible_name text NOT NULL,
  responsible_position text,
  phone text,
  company_size text,
  industry text,
  logo_url text,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritionist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
