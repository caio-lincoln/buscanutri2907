const { createClient } = require('@supabase/supabase-js')
const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function fixRLSPolicies() {
  console.log('🔧 Iniciando correção das políticas RLS...')

  // Configurar conexão PostgreSQL direta
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: {
      rejectUnauthorized: false,
      require: true,
    },
  })

  try {
    const client = await pool.connect()
    console.log('✅ Conectado ao banco de dados')

    // 1. Verificar se a tabela existe
    console.log('📋 Verificando se a tabela patient_profiles existe...')
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'patient_profiles'
      );
    `)

    if (!tableCheck.rows[0].exists) {
      console.log('📝 Criando tabela patient_profiles...')
      await client.query(`
        CREATE TABLE public.patient_profiles (
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
      `)
      console.log('✅ Tabela patient_profiles criada')
    } else {
      console.log('✅ Tabela patient_profiles já existe')
    }

    // 2. Habilitar RLS
    console.log('🔒 Habilitando RLS...')
    await client.query(
      'ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;'
    )
    console.log('✅ RLS habilitado')

    // 3. Remover políticas existentes
    console.log('🗑️ Removendo políticas existentes...')
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view their own patient profile" ON public.patient_profiles;',
      'DROP POLICY IF EXISTS "Users can update their own patient profile" ON public.patient_profiles;',
      'DROP POLICY IF EXISTS "Users can insert their own patient profile" ON public.patient_profiles;',
      'DROP POLICY IF EXISTS "Patients can manage own profile" ON public.patient_profiles;',
      'DROP POLICY IF EXISTS "Users can create patient profiles" ON public.patient_profiles;',
      'DROP POLICY IF EXISTS "Authenticated users can create patient profiles" ON public.patient_profiles;',
      'DROP POLICY IF EXISTS "Users can create their own patient profile" ON public.patient_profiles;',
      'DROP POLICY IF EXISTS "Users can delete their own patient profile" ON public.patient_profiles;',
    ]

    for (const dropSql of dropPolicies) {
      try {
        await client.query(dropSql)
      } catch (err) {
        console.log(`⚠️ Política não existia: ${err.message.split('\\n')[0]}`)
      }
    }

    // 4. Criar novas políticas
    console.log('📝 Criando novas políticas RLS...')

    const policies = [
      {
        name: 'SELECT - Users can view their own patient profile',
        sql: `CREATE POLICY "Users can view their own patient profile" ON public.patient_profiles FOR SELECT USING (auth.uid() = user_id);`,
      },
      {
        name: 'INSERT - Users can create their own patient profile',
        sql: `CREATE POLICY "Users can create their own patient profile" ON public.patient_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      },
      {
        name: 'UPDATE - Users can update their own patient profile',
        sql: `CREATE POLICY "Users can update their own patient profile" ON public.patient_profiles FOR UPDATE USING (auth.uid() = user_id);`,
      },
      {
        name: 'DELETE - Users can delete their own patient profile',
        sql: `CREATE POLICY "Users can delete their own patient profile" ON public.patient_profiles FOR DELETE USING (auth.uid() = user_id);`,
      },
    ]

    for (const policy of policies) {
      try {
        await client.query(policy.sql)
        console.log(`✅ ${policy.name}`)
      } catch (err) {
        console.log(`❌ Erro ao criar ${policy.name}: ${err.message}`)
      }
    }

    // 5. Criar índices
    console.log('📊 Criando índices...')
    try {
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON public.patient_profiles(user_id);'
      )
      console.log('✅ Índice user_id criado')
    } catch (err) {
      console.log(`⚠️ Índice user_id: ${err.message}`)
    }

    // 6. Criar função e trigger para updated_at
    console.log('⚙️ Criando função e trigger para updated_at...')
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = timezone('utc'::text, now());
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `)

      await client.query(
        'DROP TRIGGER IF EXISTS update_patient_profiles_updated_at ON public.patient_profiles;'
      )
      await client.query(`
        CREATE TRIGGER update_patient_profiles_updated_at
            BEFORE UPDATE ON public.patient_profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
      `)
      console.log('✅ Função e trigger criados')
    } catch (err) {
      console.log(`⚠️ Erro na função/trigger: ${err.message}`)
    }

    // 7. Verificar políticas criadas
    console.log('📋 Verificando políticas criadas...')
    const policiesResult = await client.query(`
      SELECT policyname, cmd, qual 
      FROM pg_policies 
      WHERE tablename = 'patient_profiles' 
      AND schemaname = 'public';
    `)

    console.log(`📊 Total de políticas: ${policiesResult.rows.length}`)
    policiesResult.rows.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd})`)
    })

    // 8. Testar inserção (simulação)
    console.log('🧪 Testando estrutura da tabela...')
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'patient_profiles' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)

    console.log('📋 Estrutura da tabela:')
    tableStructure.rows.forEach(col => {
      console.log(
        `  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`
      )
    })

    client.release()
    console.log('✅ Correção concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

fixRLSPolicies()
  .then(() => {
    console.log('🎉 Script finalizado com sucesso!')
    console.log('')
    console.log('📝 Próximos passos:')
    console.log('1. Teste a criação de perfil de paciente na aplicação')
    console.log('2. Verifique se o erro de RLS foi resolvido')
    console.log('3. Se ainda houver problemas, verifique os logs do Supabase')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })
