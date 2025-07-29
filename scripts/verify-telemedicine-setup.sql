-- Script para verificar se todas as tabelas e dados necessários estão configurados

-- 1. Verificar tabelas principais
SELECT 
    'consultations' as table_name,
    COUNT(*) as record_count,
    MAX(created_at) as last_record
FROM consultations
UNION ALL
SELECT 
    'consultation_messages' as table_name,
    COUNT(*) as record_count,
    MAX(sent_at) as last_record
FROM consultation_messages
UNION ALL
SELECT 
    'consultation_notes' as table_name,
    COUNT(*) as record_count,
    MAX(created_at) as last_record
FROM consultation_notes
UNION ALL
SELECT 
    'consultation_sessions' as table_name,
    COUNT(*) as record_count,
    MAX(started_at) as last_record
FROM consultation_sessions;

-- WebRTC tables removed - functionality under development

-- 2. Verificar usuários de teste
SELECT 
    'patient_profiles' as profile_type,
    COUNT(*) as count,
    STRING_AGG(full_name, ', ') as names
FROM patient_profiles
WHERE full_name ILIKE '%teste%'
UNION ALL
SELECT 
    'nutritionist_profiles' as profile_type,
    COUNT(*) as count,
    STRING_AGG(full_name, ', ') as names
FROM nutritionist_profiles
WHERE full_name ILIKE '%teste%';

-- 3. Verificar consultas de teste ativas
SELECT 
    c.id,
    c.scheduled_time,
    c.status,
    c.consultation_type,
    pp.full_name as patient_name,
    np.full_name as nutritionist_name,
    CASE 
        WHEN c.scheduled_time > NOW() THEN 'Futura'
        WHEN c.scheduled_time > NOW() - INTERVAL '1 hour' THEN 'Disponível'
        ELSE 'Expirada'
    END as availability
FROM consultations c
JOIN patient_profiles pp ON c.patient_id = pp.user_id
JOIN nutritionist_profiles np ON c.nutritionist_id = np.user_id
WHERE c.notes LIKE '%TESTE%' OR c.notes LIKE '%TEST%'
ORDER BY c.scheduled_time DESC
LIMIT 5;

-- 4. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'Habilitado' ELSE 'Desabilitado' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('consultations', 'consultation_messages', 'consultation_notes', 'consultation_sessions', 'webrtc_signals')
ORDER BY tablename;

-- 5. Verificar índices importantes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('consultations', 'consultation_messages', 'consultation_notes')
ORDER BY tablename, indexname;
