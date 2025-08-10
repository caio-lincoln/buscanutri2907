# BuscaNutri - Configuração do Projeto

## Conexão com Supabase Cloud

Este projeto está conectado ao projeto **BuscaNutri** no Supabase Cloud.

### Informações do Projeto

- **Nome**: BuscaNutri
- **Project ID**: lutokoucdfhfbwtppzwe
- **Região**: us-east-1
- **Status**: ACTIVE_HEALTHY
- **URL da API**: https://lutokoucdfhfbwtppzwe.supabase.co

### Configuração Local

O projeto foi configurado com:

1. ✅ Login no Supabase CLI realizado
2. ✅ Projeto linkado ao BuscaNutri remoto
3. ✅ Arquivo `.env` criado com as credenciais
4. ✅ Configuração do `config.toml` sincronizada

### Variáveis de Ambiente

As seguintes variáveis estão configuradas no arquivo `.env`:

- `SUPABASE_URL`: URL da API do projeto
- `SUPABASE_ANON_KEY`: Chave anônima para acesso público
- `SUPABASE_PROJECT_ID`: ID do projeto

### Comandos Úteis

```bash
# Verificar status da conexão
npx supabase status

# Sincronizar migrações locais com o projeto remoto
npx supabase db pull

# Aplicar migrações ao projeto remoto
npx supabase db push

# Gerar tipos TypeScript
npx supabase gen types typescript --project-id lutokoucdfhfbwtppzwe > types/supabase.ts
```

### Estrutura do Banco de Dados

O projeto BuscaNutri possui as seguintes tabelas principais:

- `users` - Usuários do sistema
- `nutritionist_profiles` - Perfis de nutricionistas
- `patient_profiles` - Perfis de pacientes
- `company_profiles` - Perfis de empresas
- `telemedicine_consultations` - Consultas de telemedicina
- `consultation_sessions` - Sessões de consulta
- E muitas outras...

### Próximos Passos

1. Desenvolver localmente usando as credenciais do projeto remoto
2. Usar as migrações existentes para manter sincronização
3. Testar funcionalidades conectado ao banco de produção

**Importante**: Este projeto está conectado ao ambiente de produção. Tenha cuidado ao fazer
alterações no banco de dados.
