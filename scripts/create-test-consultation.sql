-- Criar uma consulta de teste para testar a funcionalidade de telemedicina
-- Esta consulta será criada com horário atual para permitir teste imediato

-- Primeiro, vamos verificar se temos usuários de teste
DO $$
DECLARE
    test_patient_id UUID;
    test_nutritionist_id UUID;
    test_consultation_id UUID;
BEGIN
    -- Buscar ou criar um paciente de teste
    SELECT user_id INTO test_patient_id 
    FROM patient_profiles 
    WHERE full_name ILIKE '%teste%' OR full_name ILIKE '%test%'
    LIMIT 1;
    
    -- Se não encontrou, criar um paciente de teste
    IF test_patient_id IS NULL THEN
        -- Inserir usuário de teste na tabela auth.users (simulado)
        test_patient_id := gen_random_uuid();
        
        INSERT INTO patient_profiles (
            user_id,
            full_name,
            email,
            phone,
            birth_date,
            gender,
            created_at,
            updated_at
        ) VALUES (
            test_patient_id,
            'Paciente Teste',
            'paciente.teste@email.com',
            '(11) 99999-9999',
            '1990-01-01',
            'masculino',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Paciente de teste criado com ID: %', test_patient_id;
    ELSE
        RAISE NOTICE 'Paciente de teste encontrado com ID: %', test_patient_id;
    END IF;
    
    -- Buscar ou criar um nutricionista de teste
    SELECT user_id INTO test_nutritionist_id 
    FROM nutritionist_profiles 
    WHERE full_name ILIKE '%teste%' OR full_name ILIKE '%test%'
    LIMIT 1;
    
    -- Se não encontrou, criar um nutricionista de teste
    IF test_nutritionist_id IS NULL THEN
        test_nutritionist_id := gen_random_uuid();
        
        INSERT INTO nutritionist_profiles (
            user_id,
            full_name,
            email,
            phone,
            crn,
            specialties,
            bio,
            rating,
            total_reviews,
            years_experience,
            consultation_price,
            accepts_insurance,
            available_for_online,
            created_at,
            updated_at
        ) VALUES (
            test_nutritionist_id,
            'Dra. Nutricionista Teste',
            'nutricionista.teste@email.com',
            '(11) 88888-8888',
            'CRN-3 12345/P',
            ARRAY['Nutrição Clínica', 'Nutrição Esportiva', 'Emagrecimento'],
            'Nutricionista especializada em atendimento online com mais de 10 anos de experiência.',
            4.8,
            25,
            10,
            150.00,
            true,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Nutricionista de teste criado com ID: %', test_nutritionist_id;
    ELSE
        RAISE NOTICE 'Nutricionista de teste encontrado com ID: %', test_nutritionist_id;
    END IF;
    
    -- Criar consulta de teste com horário atual (para poder testar imediatamente)
    test_consultation_id := gen_random_uuid();
    
    INSERT INTO consultations (
        id,
        patient_id,
        nutritionist_id,
        scheduled_time,
        duration,
        status,
        consultation_type,
        price,
        payment_status,
        notes,
        created_at,
        updated_at
    ) VALUES (
        test_consultation_id,
        test_patient_id,
        test_nutritionist_id,
        NOW() + INTERVAL '2 minutes', -- 2 minutos no futuro para permitir teste
        45,
        'scheduled',
        'video',
        150.00,
        'paid',
        '🧪 CONSULTA DE TESTE - Criada automaticamente para testar funcionalidades de telemedicina',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Consulta de teste criada com ID: %', test_consultation_id;
    RAISE NOTICE 'URL para testar: /telemedicina/consulta/%', test_consultation_id;
    
    -- Criar algumas mensagens de teste
    INSERT INTO consultation_messages (
        consultation_id,
        sender_id,
        message,
        message_type,
        sent_at,
        delivered_at
    ) VALUES 
    (
        test_consultation_id,
        test_patient_id,
        'Olá, Doutora! Estou ansioso para nossa consulta.',
        'text',
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '1 hour'
    ),
    (
        test_consultation_id,
        test_nutritionist_id,
        'Olá! Também estou ansiosa. Vamos conversar sobre seus objetivos nutricionais.',
        'text',
        NOW() - INTERVAL '50 minutes',
        NOW() - INTERVAL '50 minutes'
    );
    
    -- Criar algumas notas de teste
    INSERT INTO consultation_notes (
        consultation_id,
        author_id,
        title,
        content,
        category,
        created_at,
        updated_at
    ) VALUES 
    (
        test_consultation_id,
        test_nutritionist_id,
        'Objetivos do Paciente',
        'Paciente deseja perder 5kg em 3 meses de forma saudável. Pratica exercícios 3x por semana.',
        'general',
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '30 minutes'
    ),
    (
        test_consultation_id,
        test_nutritionist_id,
        'Restrições Alimentares',
        'Paciente é intolerante à lactose. Prefere alimentos naturais e evita industrializados.',
        'symptoms',
        NOW() - INTERVAL '25 minutes',
        NOW() - INTERVAL '25 minutes'
    );
    
END $$;

-- Verificar se a consulta foi criada corretamente
SELECT 
    c.id,
    c.scheduled_time,
    c.status,
    c.consultation_type,
    pp.full_name as patient_name,
    np.full_name as nutritionist_name,
    np.crn,
    np.specialties
FROM consultations c
JOIN patient_profiles pp ON c.patient_id = pp.user_id
JOIN nutritionist_profiles np ON c.nutritionist_id = np.user_id
WHERE c.notes LIKE '%CONSULTA DE TESTE%'
ORDER BY c.created_at DESC
LIMIT 1;
