-- Script para criar o usuário nutricionista@buscanutri.com
-- IMPORTANTE: Este script deve ser executado apenas em ambiente de desenvolvimento

DO $$
DECLARE
    nutritionist_user_id UUID;
    nutritionist_profile_id UUID;
BEGIN
    -- Gerar ID único para o usuário
    nutritionist_user_id := gen_random_uuid();
    
    -- Inserir usuário na tabela auth.users
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
        nutritionist_user_id,
        'nutricionista@buscanutri.com',
        crypt('123456', gen_salt('bf')), -- senha: 123456
        NOW(),
        NOW(),
        NOW(),
        '{"user_type": "nutricionista", "full_name": "Nutricionista BuscaNutri"}',
        'authenticated'
    ) ON CONFLICT (email) DO UPDATE SET
        updated_at = NOW();
    
    -- Inserir usuário na tabela users
    INSERT INTO public.users (
        id,
        email,
        user_type,
        created_at,
        updated_at
    ) VALUES (
        nutritionist_user_id,
        'nutricionista@buscanutri.com',
        'nutricionista',
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        user_type = 'nutricionista',
        updated_at = NOW();
    
    -- Criar perfil do nutricionista
    INSERT INTO public.nutritionist_profiles (
        user_id,
        full_name,
        crn,
        phone,
        bio,
        verification_status,
        trust_seal,
        rating,
        total_reviews,
        consultation_price,
        online_consultation_available,
        created_at,
        updated_at
    ) VALUES (
        nutritionist_user_id,
        'Nutricionista BuscaNutri',
        'CRN-3 99999/P',
        '(11) 99999-9999',
        'Nutricionista oficial da plataforma BuscaNutri. Especialista em atendimento online e presencial.',
        'aprovado',
        true,
        5.0,
        100,
        120.00,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = 'Nutricionista BuscaNutri',
        verification_status = 'aprovado',
        trust_seal = true,
        updated_at = NOW();
    
    RAISE NOTICE 'Usuário nutricionista@buscanutri.com criado com sucesso!';
    RAISE NOTICE 'ID do usuário: %', nutritionist_user_id;
    RAISE NOTICE 'Email: nutricionista@buscanutri.com';
    RAISE NOTICE 'Senha: 123456';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar usuário: %', SQLERRM;
END $$;

-- Verificar se o usuário foi criado corretamente
SELECT 
    u.id,
    u.email,
    u.user_type,
    np.full_name,
    np.crn,
    np.verification_status,
    np.trust_seal,
    u.created_at
FROM public.users u
LEFT JOIN public.nutritionist_profiles np ON u.id = np.user_id
WHERE u.email = 'nutricionista@buscanutri.com';