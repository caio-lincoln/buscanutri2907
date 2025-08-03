# Como Corrigir o MCP do Supabase

## Problema Identificado

O MCP (Model Context Protocol) do Supabase está falhando com o erro:
```
Project reference in URL is not valid. Check the URL of the resource.
```

## Causa do Problema

O MCP do Supabase requer um **Personal Access Token** para funcionar corretamente, que não estava configurado.

## Solução

### Passo 1: Criar um Personal Access Token

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Create new token"
3. Dê um nome descritivo como "MCP Token" ou "Trae AI MCP"
4. Copie o token gerado (você só verá ele uma vez!)

### Passo 2: Configurar o Token

1. Abra o arquivo `.env` na raiz do projeto
2. Substitua `your_personal_access_token_here` pelo token que você criou:
   ```
   SUPABASE_ACCESS_TOKEN=seu_token_aqui
   ```

### Passo 3: Verificar a Configuração

Execute o script de teste para verificar se tudo está funcionando:
```bash
node scripts/test-mcp-connection.js
```

## Configuração Atual

✅ **Project ID**: `lutokoucdfhfbwtppzwe` (correto)
✅ **Project URL**: `https://lutokoucdfhfbwtppzwe.supabase.co` (correto)
✅ **Service Role Key**: Configurada (correto)
❌ **Personal Access Token**: Precisa ser configurado

## Após Configurar o Token

Depois de configurar o token, você poderá:

1. ✅ Usar comandos MCP para listar tabelas
2. ✅ Executar migrações via MCP
3. ✅ Aplicar correções de RLS via MCP
4. ✅ Gerenciar o banco de dados via MCP

## Comandos de Teste

Após configurar o token, teste com:

```javascript
// Listar tabelas
mcp_supabase_list_tables()

// Executar SQL
mcp_supabase_execute_sql("SELECT current_database();")

// Aplicar migração
mcp_supabase_apply_migration("test_migration", "SELECT 1;")
```

## Segurança

⚠️ **Importante**: O Personal Access Token dá acesso completo à sua conta Supabase. Mantenha-o seguro e não o compartilhe.

## Status da Conexão Direta

✅ A conexão direta com o Supabase está funcionando perfeitamente
✅ As credenciais estão corretas
✅ O banco de dados está acessível
✅ A tabela `patient_profiles` existe e está acessível

O problema é especificamente com o MCP, não com a conexão do Supabase em si.