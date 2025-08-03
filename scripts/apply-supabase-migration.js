const { execSync } = require('child_process');
require('dotenv').config();

// Verificar se as variáveis de ambiente necessárias estão definidas
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_PROJECT_ID'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Variável de ambiente ${envVar} não encontrada`);
    process.exit(1);
  }
}

console.log('🚀 Aplicando migração do Supabase...');

try {
  // Configurar o CLI do Supabase com o token de acesso
  console.log('⚙️ Configurando o CLI do Supabase...');
  execSync(`npx supabase login ${process.env.SUPABASE_ACCESS_TOKEN}`, { stdio: 'inherit' });
  
  // Aplicar a migração
  console.log('⚙️ Aplicando migração...');
  execSync(`npx supabase db push`, { stdio: 'inherit' });
  
  console.log('✅ Migração aplicada com sucesso!');
} catch (error) {
  console.error('❌ Erro ao aplicar migração:', error.message);
  process.exit(1);
}