-- Atualizar função handle_new_user para criar perfis automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirmar o usuário
  UPDATE auth.users 
  SET 
    email_confirmed_at = now(),
    confirmed_at = now()
  WHERE id = NEW.id;

  -- 1. Garantir que o usuário exista na tabela public.users
  -- Tenta inserir o usuário na tabela pública, ignorando se já existir
  BEGIN
    INSERT INTO public.users (id, email, user_type, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      (NEW.raw_user_meta_data->>'user_type')::public.user_type,
      NEW.created_at,
      NEW.created_at
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN others THEN
    -- Ignorar erros de inserção em public.users para não bloquear o cadastro
    -- O erro pode ser de tipo enum inválido ou outra constraint
    RAISE WARNING 'Erro ao inserir em public.users: %', SQLERRM;
  END;
  
  -- 2. Criar perfil de paciente se user_type for 'paciente'
  IF (NEW.raw_user_meta_data->>'user_type') = 'paciente' THEN
    BEGIN
      INSERT INTO public.patient_profiles (user_id, full_name)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Paciente sem nome')
      )
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN others THEN
      -- Ignorar erros na criação do perfil para não bloquear o cadastro
      RAISE WARNING 'Erro ao criar perfil de paciente: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
