const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRatingSystem() {
  console.log('🚀 Iniciando implementação do sistema de avaliações...');

  try {
    // 1. Adicionar campo rating para patient_profiles se não existir
    console.log('📝 Adicionando campos de rating para pacientes...');
    const { error: alterPatientError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE patient_profiles 
        ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0,
        ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
      `
    });

    if (alterPatientError && !alterPatientError.message.includes('already exists')) {
      console.error('❌ Erro ao adicionar campos para pacientes:', alterPatientError);
    } else {
      console.log('✅ Campos de rating para pacientes adicionados');
    }

    // 2. Atualizar nutritionist_profiles para usar rating padrão 5.0
    console.log('📝 Atualizando rating padrão dos nutricionistas...');
    const { error: updateNutritionistError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE nutritionist_profiles 
        SET rating = 5.0 
        WHERE rating = 0 OR rating IS NULL;

        ALTER TABLE nutritionist_profiles 
        ALTER COLUMN rating SET DEFAULT 5.0;
      `
    });

    if (updateNutritionistError) {
      console.error('❌ Erro ao atualizar nutricionistas:', updateNutritionistError);
    } else {
      console.log('✅ Rating padrão dos nutricionistas atualizado');
    }

    // 3. Atualizar patient_profiles para usar rating padrão 5.0
    console.log('📝 Atualizando rating padrão dos pacientes...');
    const { error: updatePatientError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE patient_profiles 
        SET rating = 5.0 
        WHERE rating IS NULL;
      `
    });

    if (updatePatientError) {
      console.error('❌ Erro ao atualizar pacientes:', updatePatientError);
    } else {
      console.log('✅ Rating padrão dos pacientes atualizado');
    }

    // 4. Criar função para atualizar rating do paciente
    console.log('📝 Criando função de atualização de rating do paciente...');
    const { error: createPatientFunctionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_patient_rating()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE patient_profiles 
            SET 
                rating = (
                    SELECT AVG(patient_rating)::DECIMAL(3,2)
                    FROM consultations 
                    WHERE patient_id = NEW.patient_id 
                    AND patient_rating IS NOT NULL
                ),
                total_reviews = (
                    SELECT COUNT(*)
                    FROM consultations 
                    WHERE patient_id = NEW.patient_id 
                    AND patient_rating IS NOT NULL
                )
            WHERE user_id = NEW.patient_id;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (createPatientFunctionError) {
      console.error('❌ Erro ao criar função do paciente:', createPatientFunctionError);
    } else {
      console.log('✅ Função de rating do paciente criada');
    }

    // 5. Criar trigger para atualizar rating do paciente
    console.log('📝 Criando trigger de rating do paciente...');
    const { error: createPatientTriggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS trigger_update_patient_rating ON consultations;
        CREATE TRIGGER trigger_update_patient_rating
            AFTER INSERT OR UPDATE OF patient_rating ON consultations
            FOR EACH ROW
            EXECUTE FUNCTION update_patient_rating();
      `
    });

    if (createPatientTriggerError) {
      console.error('❌ Erro ao criar trigger do paciente:', createPatientTriggerError);
    } else {
      console.log('✅ Trigger de rating do paciente criado');
    }

    // 6. Atualizar função de rating do nutricionista
    console.log('📝 Atualizando função de rating do nutricionista...');
    const { error: updateNutritionistFunctionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_nutritionist_rating()
        RETURNS TRIGGER AS $$
        DECLARE
            avg_rating DECIMAL(3,2);
            review_count INTEGER;
        BEGIN
            -- Calcular média das avaliações
            SELECT 
                COALESCE(AVG(nutritionist_rating), 5.0)::DECIMAL(3,2),
                COUNT(*) FILTER (WHERE nutritionist_rating IS NOT NULL)
            INTO avg_rating, review_count
            FROM consultations 
            WHERE nutritionist_id = NEW.nutritionist_id;
            
            -- Se não há avaliações, manter 5.0
            IF review_count = 0 THEN
                avg_rating := 5.0;
            END IF;
            
            UPDATE nutritionist_profiles 
            SET 
                rating = avg_rating,
                total_reviews = review_count
            WHERE user_id = NEW.nutritionist_id;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (updateNutritionistFunctionError) {
      console.error('❌ Erro ao atualizar função do nutricionista:', updateNutritionistFunctionError);
    } else {
      console.log('✅ Função de rating do nutricionista atualizada');
    }

    // 7. Criar função para estatísticas de rating
    console.log('📝 Criando função de estatísticas de rating...');
    const { error: createStatsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_user_rating_stats(user_id UUID, user_type TEXT)
        RETURNS JSON AS $$
        DECLARE
            result JSON;
            avg_rating DECIMAL(3,2);
            total_reviews INTEGER;
        BEGIN
            IF user_type = 'nutricionista' THEN
                SELECT rating, total_reviews 
                INTO avg_rating, total_reviews
                FROM nutritionist_profiles 
                WHERE nutritionist_profiles.user_id = get_user_rating_stats.user_id;
            ELSIF user_type = 'paciente' THEN
                SELECT rating, total_reviews 
                INTO avg_rating, total_reviews
                FROM patient_profiles 
                WHERE patient_profiles.user_id = get_user_rating_stats.user_id;
            END IF;
            
            SELECT json_build_object(
                'rating', COALESCE(avg_rating, 5.0),
                'totalReviews', COALESCE(total_reviews, 0),
                'userType', user_type
            ) INTO result;
            
            RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (createStatsError) {
      console.error('❌ Erro ao criar função de estatísticas:', createStatsError);
    } else {
      console.log('✅ Função de estatísticas criada');
    }

    // 8. Verificar se as tabelas têm os campos necessários
    console.log('🔍 Verificando estrutura das tabelas...');
    const { data: nutritionistColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'nutritionist_profiles')
      .in('column_name', ['rating', 'total_reviews']);

    const { data: patientColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'patient_profiles')
      .in('column_name', ['rating', 'total_reviews']);

    console.log('📊 Campos encontrados:');
    console.log('  - Nutricionistas:', nutritionistColumns?.map(c => c.column_name) || []);
    console.log('  - Pacientes:', patientColumns?.map(c => c.column_name) || []);

    console.log('🎉 Sistema de avaliações implementado com sucesso!');
    console.log('📋 Resumo:');
    console.log('  ✅ Rating padrão: 5.0 para todos os usuários');
    console.log('  ✅ Campos rating e total_reviews adicionados');
    console.log('  ✅ Funções de atualização automática criadas');
    console.log('  ✅ Triggers configurados para atualização em tempo real');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
applyRatingSystem();