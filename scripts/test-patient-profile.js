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

// Função ensurePatientProfile (copiada do código original)
async function ensurePatientProfile(userId) {
  console.log(`🔍 Verificando perfil do paciente para usuário: ${userId}`);

  try {
    // Primeiro, tentar buscar o perfil existente
    const { data: existingProfile, error: fetchError } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.log('❌ Erro ao buscar perfil existente:', fetchError.message);
      throw fetchError;
    }

    if (existingProfile) {
      console.log('✅ Perfil do paciente já existe:', existingProfile);
      return existingProfile;
    }

    console.log('📝 Perfil não encontrado, criando novo...');

    // Buscar informações do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.log('❌ Erro ao buscar dados do usuário:', userError.message);
      throw userError;
    }

    console.log(`📧 Email do usuário: ${user.email}`);

    // Criar novo perfil
    const newProfile = {
      user_id: userId,
      full_name: user.email.split('@')[0], // Nome baseado no email
      email: user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Dados do novo perfil:', newProfile);

    const { data: createdProfile, error: createError } = await supabase
      .from('patient_profiles')
      .insert(newProfile)
      .select()
      .single();

    if (createError) {
      console.log('❌ Erro ao criar perfil:', createError.message);
      console.log('📋 Detalhes do erro:', createError);
      throw createError;
    }

    console.log('✅ Perfil criado com sucesso:', createdProfile);
    return createdProfile;

  } catch (error) {
    console.error('💥 Erro na função ensurePatientProfile:', error.message);
    throw error;
  }
}

async function testPatientProfileCreation() {
  console.log('🧪 Iniciando teste de criação de perfil de paciente...');

  try {
    // Buscar um usuário existente para teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado para teste');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Testando com usuário: ${testUser.email} (${testUser.id})`);

    // Testar a função ensurePatientProfile
    const profile = await ensurePatientProfile(testUser.id);
    
    console.log('🎉 Teste concluído com sucesso!');
    console.log('📋 Perfil final:', profile);

  } catch (error) {
    console.error('💥 Teste falhou:', error.message);
    console.error('📋 Stack trace:', error.stack);
  }
}

// Executar o teste
testPatientProfileCreation()
  .then(() => {
    console.log('✅ Script de teste finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal no teste:', error);
    process.exit(1);
  });