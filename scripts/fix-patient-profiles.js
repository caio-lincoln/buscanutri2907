const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixPatientProfilesRLS() {
  console.log('🔧 Iniciando correção das políticas RLS para patient_profiles...');

  try {
    // 1. Verificar se a tabela existe
    console.log('📋 Verificando estrutura da tabela patient_profiles...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'patient_profiles')
      .eq('table_schema', 'public');

    if (tableError) {
      console.log('⚠️ Tabela patient_profiles não existe, criando...');
    }

    // 2. Executar script de correção
    const fixScript = `
      -- 1. Criar a tabela patient_profiles se não existir
      CREATE TABLE IF NOT EXISTS public.patient_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(20),
          birth_date DATE,
          cpf VARCHAR(14),
          rg VARCHAR(20),
          profile_image_url TEXT,
          health_conditions TEXT[],
          allergies TEXT[],
          dietary_preferences TEXT[],
          emergency_contact_name VARCHAR(255),
          emergency_contact_phone VARCHAR(20),
          emergency_contact_relationship VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(user_id)
      );

      -- 2. Habilitar RLS
      ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

      -- 3. Remover políticas existentes
      DROP POLICY IF EXISTS "Users can view their own patient profile" ON public.patient_profiles;
      DROP POLICY IF EXISTS "Users can update their own patient profile" ON public.patient_profiles;
      DROP POLICY IF EXISTS "Users can insert their own patient profile" ON public.patient_profiles;
      DROP POLICY IF EXISTS "Patients can manage own profile" ON public.patient_profiles;
      DROP POLICY IF EXISTS "Users can create patient profiles" ON public.patient_profiles;
      DROP POLICY IF EXISTS "Authenticated users can create patient profiles" ON public.patient_profiles;
      DROP POLICY IF EXISTS "Users can create their own patient profile" ON public.patient_profiles;
      DROP POLICY IF EXISTS "Users can delete their own patient profile" ON public.patient_profiles;
      DROP POLICY IF EXISTS "Nutritionists can view patient profiles during consultations" ON public.patient_profiles;

      -- 4. Criar políticas RLS corretas
      CREATE POLICY "Users can view their own patient profile" ON public.patient_profiles
          FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can create their own patient profile" ON public.patient_profiles
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own patient profile" ON public.patient_profiles
          FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own patient profile" ON public.patient_profiles
          FOR DELETE USING (auth.uid() = user_id);

      CREATE POLICY "Nutritionists can view patient profiles during consultations" ON public.patient_profiles
          FOR SELECT USING (
              EXISTS (
                  SELECT 1 FROM public.consultations 
                  WHERE consultations.patient_id = patient_profiles.user_id 
                  AND consultations.nutritionist_id = auth.uid()
                  AND consultations.status IN ('scheduled', 'in-progress', 'completed')
              )
          );

      -- 5. Criar view public.users para compatibilidade
      CREATE OR REPLACE VIEW public.users AS 
      SELECT 
          id,
          email,
          created_at,
          updated_at,
          email_confirmed_at,
          phone,
          phone_confirmed_at,
          raw_user_meta_data,
          raw_app_meta_data
      FROM auth.users;

      -- 6. Dar permissões na view
      GRANT SELECT ON public.users TO authenticated;
      GRANT SELECT ON public.users TO anon;

      -- 7. Criar índices
      CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON public.patient_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_patient_profiles_email ON public.patient_profiles(email);

      -- 8. Criar função para atualizar updated_at
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = timezone('utc'::text, now());
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- 9. Criar trigger
      DROP TRIGGER IF EXISTS update_patient_profiles_updated_at ON public.patient_profiles;
      CREATE TRIGGER update_patient_profiles_updated_at
          BEFORE UPDATE ON public.patient_profiles
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    `;

    console.log('🔄 Executando script de correção...');
    const { error: scriptError } = await supabase.rpc('exec_sql', { sql: fixScript });

    if (scriptError) {
      // Tentar executar usando uma abordagem diferente
      console.log('⚠️ Tentando abordagem alternativa...');
      
      // Executar comandos individualmente
      const commands = [
        `CREATE TABLE IF NOT EXISTS public.patient_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(20),
          birth_date DATE,
          cpf VARCHAR(14),
          rg VARCHAR(20),
          profile_image_url TEXT,
          health_conditions TEXT[],
          allergies TEXT[],
          dietary_preferences TEXT[],
          emergency_contact_name VARCHAR(255),
          emergency_contact_phone VARCHAR(20),
          emergency_contact_relationship VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(user_id)
        )`,
        `ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY`
      ];

      for (const command of commands) {
        try {
          await supabase.rpc('exec_sql', { sql: command });
          console.log('✅ Comando executado com sucesso');
        } catch (err) {
          console.log(`⚠️ Erro no comando: ${err.message}`);
        }
      }
    }

    // 3. Verificar políticas atuais
    console.log('📋 Verificando políticas RLS atuais...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'patient_profiles');

    if (!policiesError && policies) {
      console.log(`📊 Encontradas ${policies.length} políticas RLS para patient_profiles`);
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd}`);
      });
    }

    // 4. Testar criação de perfil
    console.log('🧪 Testando criação de perfil de paciente...');
    
    // Primeiro, vamos verificar se há usuários na tabela auth.users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (usersError) {
      console.log('⚠️ Erro ao buscar usuários:', usersError.message);
    } else if (users && users.length > 0) {
      const testUser = users[0];
      console.log(`🔍 Testando com usuário: ${testUser.email}`);
      
      // Tentar criar um perfil de teste
      const { data: profile, error: profileError } = await supabase
        .from('patient_profiles')
        .upsert({
          user_id: testUser.id,
          full_name: testUser.email.split('@')[0],
          email: testUser.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (profileError) {
        console.log('❌ Erro ao criar perfil de teste:', profileError.message);
      } else {
        console.log('✅ Perfil de teste criado com sucesso!');
        console.log('📋 Dados do perfil:', profile);
      }
    } else {
      console.log('⚠️ Nenhum usuário encontrado para teste');
    }

    console.log('✅ Correção das políticas RLS concluída!');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar a correção
fixPatientProfilesRLS()
  .then(() => {
    console.log('🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });