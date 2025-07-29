-- Script para criar usuários de autenticação de teste
-- IMPORTANTE: Este script deve ser executado apenas em ambiente de desenvolvimento

-- Inserir usuário paciente de teste na tabela auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    role
) VALUES (
    (SELECT user_id FROM patient_profiles WHERE full_name = 'Paciente Teste' LIMIT 1),
    'paciente.teste@email.com',
    crypt('123456', gen_salt('bf')), -- senha: 123456
    NOW(),
    NOW(),
    NOW(),
    '{"user_type": "paciente", "full_name": "Paciente Teste"}',
    'authenticated'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Inserir usuário nutricionista de teste na tabela auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    role
) VALUES (
    (SELECT user_id FROM nutritionist_profiles WHERE full_name = 'Dra. Nutricionista Teste' LIMIT 1),
    'nutricionista.teste@email.com',
    crypt('123456', gen_salt('bf')), -- senha: 123456
    NOW(),
    NOW(),
    NOW(),
    '{"user_type": "nutricionista", "full_name": "Dra. Nutricionista Teste"}',
    'authenticated'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Verificar se os usuários foram criados
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'user_type' as user_type,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.created_at
FROM auth.users u
WHERE u.email IN ('paciente.teste@email.com', 'nutricionista.teste@email.com')
ORDER BY u.created_at DESC;
