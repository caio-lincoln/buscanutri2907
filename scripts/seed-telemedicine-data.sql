-- Inserir dados de exemplo para telemedicina
-- Script corrigido com sintaxe PostgreSQL adequada

DO $$
DECLARE
    patient_user_id UUID;
    nutritionist_user_id UUID;
    nutritionist_2_id UUID;
    nutritionist_3_id UUID;
    consultation_id_1 UUID;
    consultation_id_2 UUID;
    consultation_id_3 UUID;
    consultation_id_4 UUID;
    consultation_id_5 UUID;
BEGIN
    -- Buscar IDs de usuários existentes
    SELECT id INTO patient_user_id FROM auth.users WHERE email ILIKE '%paciente%' OR email ILIKE '%patient%' LIMIT 1;
    SELECT id INTO nutritionist_user_id FROM auth.users WHERE email ILIKE '%nutricionista%' OR email ILIKE '%nutritionist%' LIMIT 1;
    
    -- Se não encontrar usuários, criar alguns de exemplo
    IF patient_user_id IS NULL THEN
        patient_user_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            patient_user_id,
            'paciente.exemplo@email.com',
            crypt('senha123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        );
        
        -- Criar perfil do paciente
        INSERT INTO patient_profiles (user_id, full_name, birth_date, phone, health_conditions, allergies)
        VALUES (
            patient_user_id,
            'Maria Silva Santos',
            '1990-05-15',
            '(11) 99999-9999',
            ARRAY['Diabetes tipo 2'],
            ARRAY['Lactose']
        );
    END IF;
    
    IF nutritionist_user_id IS NULL THEN
        nutritionist_user_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            nutritionist_user_id,
            'nutricionista.exemplo@email.com',
            crypt('senha123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        );
        
        -- Criar perfil do nutricionista
        INSERT INTO nutritionist_profiles (user_id, full_name, crn, specialties, rating, total_reviews)
        VALUES (
            nutritionist_user_id,
            'Dra. Ana Costa Silva',
            'CRN3-12345',
            ARRAY['Nutrição Clínica', 'Emagrecimento'],
            4.9,
            127
        );
    END IF;
    
    -- Criar segundo nutricionista
    nutritionist_2_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
        nutritionist_2_id,
        'carlos.silva@email.com',
        crypt('senha123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
    );
    
    INSERT INTO nutritionist_profiles (user_id, full_name, crn, specialties, rating, total_reviews)
    VALUES (
        nutritionist_2_id,
        'Dr. Carlos Silva',
        'CRN3-67890',
        ARRAY['Nutrição Esportiva', 'Suplementação'],
        4.8,
        156
    );
    
    -- Criar terceiro nutricionista
    nutritionist_3_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
        nutritionist_3_id,
        'pedro.lima@email.com',
        crypt('senha123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
    );
    
    INSERT INTO nutritionist_profiles (user_id, full_name, crn, specialties, rating, total_reviews)
    VALUES (
        nutritionist_3_id,
        'Dr. Pedro Lima',
        'CRN3-11111',
        ARRAY['Nutrição Infantil', 'Alergias Alimentares'],
        4.7,
        89
    );
    
    -- Inserir consultas de exemplo
    -- Consulta 1: agendada para hoje
    consultation_id_1 := gen_random_uuid();
    INSERT INTO consultations (
        id, patient_id, nutritionist_id, scheduled_time, duration, status,
        consultation_type, notes, price, payment_status
    ) VALUES (
        consultation_id_1,
        patient_user_id,
        nutritionist_user_id,
        NOW() + INTERVAL '2 hours',
        45,
        'scheduled',
        'video',
        'Primeira consulta - Avaliação nutricional completa',
        150.00,
        'paid'
    );
    
    -- Consulta 2: agendada para amanhã
    consultation_id_2 := gen_random_uuid();
    INSERT INTO consultations (
        id, patient_id, nutritionist_id, scheduled_time, duration, status,
        consultation_type, notes, price, payment_status
    ) VALUES (
        consultation_id_2,
        patient_user_id,
        nutritionist_user_id,
        NOW() + INTERVAL '1 day' + INTERVAL '3 hours',
        30,
        'scheduled',
        'video',
        'Consulta de retorno - Acompanhamento do plano alimentar',
        120.00,
        'paid'
    );
    
    -- Consulta 3: concluída (1 semana atrás)
    consultation_id_3 := gen_random_uuid();
    INSERT INTO consultations (
        id, patient_id, nutritionist_id, scheduled_time, duration, status,
        consultation_type, notes, price, payment_status
    ) VALUES (
        consultation_id_3,
        patient_user_id,
        nutritionist_user_id,
        NOW() - INTERVAL '1 week',
        45,
        'completed',
        'video',
        'Consulta inicial - Definição de objetivos',
        150.00,
        'paid'
    );
    
    -- Consulta 4: concluída mais antiga (2 semanas atrás)
    consultation_id_4 := gen_random_uuid();
    INSERT INTO consultations (
        id, patient_id, nutritionist_id, scheduled_time, duration, status,
        consultation_type, notes, price, payment_status
    ) VALUES (
        consultation_id_4,
        patient_user_id,
        nutritionist_user_id,
        NOW() - INTERVAL '2 weeks',
        30,
        'completed',
        'video',
        'Acompanhamento mensal - Ajustes no plano',
        120.00,
        'paid'
    );
    
    -- Consulta 5: com segundo nutricionista
    consultation_id_5 := gen_random_uuid();
    INSERT INTO consultations (
        id, patient_id, nutritionist_id, scheduled_time, duration, status,
        consultation_type, notes, price, payment_status
    ) VALUES (
        consultation_id_5,
        patient_user_id,
        nutritionist_2_id,
        NOW() - INTERVAL '3 weeks',
        45,
        'completed',
        'video',
        'Consulta sobre nutrição esportiva',
        180.00,
        'paid'
    );
    
    -- Inserir mensagens de exemplo
    INSERT INTO consultation_messages (consultation_id, sender_id, message, message_type, sent_at, delivered_at) VALUES
    (consultation_id_3, nutritionist_user_id, 'Olá! Como você está se sentindo com o novo plano alimentar?', 'text', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
    (consultation_id_3, patient_user_id, 'Estou me sentindo muito melhor! Obrigada pelas orientações.', 'text', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    (consultation_id_4, nutritionist_user_id, 'Lembre-se de beber bastante água durante o dia.', 'text', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    (consultation_id_5, nutritionist_2_id, 'Vamos ajustar sua dieta para melhorar o desempenho nos treinos.', 'text', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    (consultation_id_5, patient_user_id, 'Perfeito! Estou animada para começar.', 'text', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
    
    -- Inserir notas de exemplo
    INSERT INTO consultation_notes (consultation_id, author_id, title, content, category) VALUES
    (consultation_id_3, nutritionist_user_id, 'Avaliação Inicial', 'Paciente apresenta histórico de dieta restritiva. IMC: 24.5. Objetivo: manutenção do peso com foco em saúde.', 'diagnosis'),
    (consultation_id_3, nutritionist_user_id, 'Plano Alimentar', 'Dieta de 1800 kcal/dia, rica em fibras e proteínas. 6 refeições diárias. Hidratação: 2L água/dia.', 'treatment'),
    (consultation_id_4, nutritionist_user_id, 'Acompanhamento', 'Paciente relatou melhora na disposição. Peso mantido. Continuar com o plano atual.', 'followup'),
    (consultation_id_5, nutritionist_2_id, 'Avaliação Esportiva', 'Paciente pratica corrida 3x/semana. Necessário ajuste de carboidratos pré-treino.', 'diagnosis'),
    (consultation_id_5, nutritionist_2_id, 'Suplementação', 'Recomendado: Whey protein pós-treino e BCAA durante exercícios longos.', 'treatment');
    
    -- Inserir nutricionistas favoritos
    INSERT INTO patient_favorite_nutritionists (patient_id, nutritionist_id) VALUES
    (patient_user_id, nutritionist_user_id),
    (patient_user_id, nutritionist_2_id);
    
    -- Inserir avaliações
    INSERT INTO consultation_reviews (consultation_id, patient_id, nutritionist_id, rating, comment) VALUES
    (consultation_id_3, patient_user_id, nutritionist_user_id, 5, 'Excelente profissional! Muito atenciosa e didática nas explicações.'),
    (consultation_id_4, patient_user_id, nutritionist_user_id, 5, 'Sempre muito prestativa e com orientações claras. Recomendo!'),
    (consultation_id_5, patient_user_id, nutritionist_2_id, 4, 'Ótimo conhecimento em nutrição esportiva. Me ajudou muito!');
    
    RAISE NOTICE 'Dados de exemplo inseridos com sucesso!';
    RAISE NOTICE 'Patient ID: %', patient_user_id;
    RAISE NOTICE 'Nutritionist ID: %', nutritionist_user_id;
    RAISE NOTICE 'Nutritionist 2 ID: %', nutritionist_2_id;
    RAISE NOTICE 'Nutritionist 3 ID: %', nutritionist_3_id;
    
END $$;

-- Verificar se os dados foram inseridos corretamente
SELECT 
    'Consultas inseridas' as tipo,
    COUNT(*) as quantidade
FROM consultations
UNION ALL
SELECT 
    'Mensagens inseridas' as tipo,
    COUNT(*) as quantidade
FROM consultation_messages
UNION ALL
SELECT 
    'Notas inseridas' as tipo,
    COUNT(*) as quantidade
FROM consultation_notes
UNION ALL
SELECT 
    'Favoritos inseridos' as tipo,
    COUNT(*) as quantidade
FROM patient_favorite_nutritionists
UNION ALL
SELECT 
    'Avaliações inseridas' as tipo,
    COUNT(*) as quantidade
FROM consultation_reviews
UNION ALL
SELECT 
    'Usuários criados' as tipo,
    COUNT(*) as quantidade
FROM auth.users
WHERE email IN ('paciente.exemplo@email.com', 'nutricionista.exemplo@email.com', 'carlos.silva@email.com', 'pedro.lima@email.com');
