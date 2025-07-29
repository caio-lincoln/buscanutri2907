-- Configurar auto-confirmação de usuários
-- Este script desabilita a necessidade de confirmação de email

-- 1. Atualizar configurações de autenticação
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = false
WHERE true;

-- 2. Confirmar automaticamente usuários existentes que não foram confirmados
UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  confirmed_at = now()
WHERE 
  email_confirmed_at IS NULL 
  AND confirmed_at IS NULL;

-- 3. Criar função para auto-confirmar novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirmar o usuário
  UPDATE auth.users 
  SET 
    email_confirmed_at = now(),
    confirmed_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para executar a função em novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar se as configurações foram aplicadas
SELECT 
  'Auto-confirmação configurada com sucesso!' as status,
  enable_signup,
  enable_confirmations
FROM auth.config;
