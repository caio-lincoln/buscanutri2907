const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createRLSPolicies() {
  console.log('🔧 Criando políticas RLS para patient_profiles...');

  const policies = [
    {
      name: 'Users can view their own patient profile',
      sql: `CREATE POLICY "Users can view their own patient profile" ON public.patient_profiles FOR SELECT USING (auth.uid() = user_id);`
    },
    {
      name: 'Users can create their own patient profile', 
      sql: `CREATE POLICY "Users can create their own patient profile" ON public.patient_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`
    },
    {
      name: 'Users can update their own patient profile',
      sql: `CREATE POLICY "Users can update their own patient profile" ON public.patient_profiles FOR UPDATE USING (auth.uid() = user_id);`
    },
    {
      name: 'Users can delete their own patient profile',
      sql: `CREATE POLICY "Users can delete their own patient profile" ON public.patient_profiles FOR DELETE USING (auth.uid() = user_id);`
    }
  ];

  // Primeiro, remover políticas existentes
  console.log('🗑️ Removendo políticas existentes...');
  const dropPolicies = [
    `DROP POLICY IF EXISTS "Users can view their own patient profile" ON public.patient_profiles;`,
    `DROP POLICY IF EXISTS "Users can update their own patient profile" ON public.patient_profiles;`,
    `DROP POLICY IF EXISTS "Users can insert their own patient profile" ON public.patient_profiles;`,
    `DROP POLICY IF EXISTS "Patients can manage own profile" ON public.patient_profiles;`,
    `DROP POLICY IF EXISTS "Users can create patient profiles" ON public.patient_profiles;`,
    `DROP POLICY IF EXISTS "Authenticated users can create patient profiles" ON public.patient_profiles;`,
    `DROP POLICY IF EXISTS "Users can create their own patient profile" ON public.patient_profiles;`,
    `DROP POLICY IF EXISTS "Users can delete their own patient profile" ON public.patient_profiles;`
  ];

  for (const dropSql of dropPolicies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: dropSql });
      if (error) {
        console.log(`⚠️ Aviso ao remover política: ${error.message}`);
      }
    } catch (err) {
      console.log(`⚠️ Erro ao remover política: ${err.message}`);
    }
  }

  // Habilitar RLS
  console.log('🔒 Habilitando RLS...');
  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;' 
    });
    if (error) {
      console.log(`⚠️ Aviso ao habilitar RLS: ${error.message}`);
    } else {
      console.log('✅ RLS habilitado');
    }
  } catch (err) {
    console.log(`⚠️ Erro ao habilitar RLS: ${err.message}`);
  }

  // Criar novas políticas
  console.log('📝 Criando novas políticas...');
  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (error) {
        console.log(`❌ Erro ao criar política "${policy.name}": ${error.message}`);
      } else {
        console.log(`✅ Política criada: ${policy.name}`);
      }
    } catch (err) {
      console.log(`❌ Erro ao criar política "${policy.name}": ${err.message}`);
    }
  }

  // Verificar políticas criadas
  console.log('📋 Verificando políticas criadas...');
  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual')
      .eq('tablename', 'patient_profiles');

    if (error) {
      console.log('⚠️ Erro ao verificar políticas:', error.message);
    } else {
      console.log(`📊 Total de políticas encontradas: ${data.length}`);
      data.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }
  } catch (err) {
    console.log('⚠️ Erro ao verificar políticas:', err.message);
  }

  console.log('✅ Configuração de políticas RLS concluída!');
}

createRLSPolicies()
  .then(() => {
    console.log('🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });