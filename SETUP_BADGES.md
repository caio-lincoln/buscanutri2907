# Configuração Completa do Banco de Dados

Este documento explica como configurar todas as tabelas necessárias no Supabase para resolver erros de relacionamento e garantir o funcionamento completo da aplicação.

## Problemas Resolvidos

- ✅ Erro `PGRST200` - Relacionamento entre `nutritionist_badges` e `badges`
- ✅ Tabelas de especialidades, agendamentos, avaliações e outras funcionalidades
- ✅ Configuração de RLS (Row Level Security)
- ✅ Dados iniciais (especialidades, badges, localizações)

## Problema Original

O erro `PGRST200` indica que não foi encontrado um relacionamento de chave estrangeira entre as tabelas `nutritionist_badges` e `badges` no esquema `public`. Isso acontece porque essas tabelas ainda não foram criadas no banco de dados.

## Solução

### Opção 1: Executar via SQL Editor do Supabase (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Copie e cole o conteúdo do arquivo `supabase/migrations/20240101000000_create_badges_tables.sql`
5. Execute o script clicando em **Run**

### Opção 2: Via Supabase CLI (Se configurado)

```bash
# Se você tem o Supabase CLI configurado
supabase db push
```

## Estrutura das Tabelas

### Tabela `badges`
- `id`: UUID (chave primária)
- `name`: Nome da insígnia
- `description`: Descrição da insígnia
- `icon_url`: URL do ícone (opcional)
- `criteria`: Critérios para obtenção
- `points`: Pontos atribuídos
- `is_active`: Se a insígnia está ativa
- `created_at`, `updated_at`: Timestamps

### Tabela `nutritionist_badges`
- `id`: UUID (chave primária)
- `nutritionist_id`: Referência para `nutritionist_profiles`
- `badge_id`: Referência para `badges`
- `awarded_at`: Data de atribuição
- `awarded_by`: Quem atribuiu (opcional)
- `notes`: Observações (opcional)

## Badges Padrão

O script cria automaticamente as seguintes insígnias:

1. **Nutricionista Verificado** - Documentação verificada
2. **Especialista em Emagrecimento** - Especialização comprovada
3. **Especialista em Esportes** - Nutrição esportiva
4. **Top Avaliado** - Excelentes avaliações (4.5+)
5. **Experiência 5+ Anos** - Mais de 5 anos de experiência
6. **Consultas Online** - Oferece consultas online
7. **Resposta Rápida** - Responde rapidamente
8. **Planos Personalizados** - Cria planos personalizados

## Configuração de Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

Use o arquivo `.env.local.example` como referência.

## Verificação

Após executar o script:

1. Verifique se as tabelas foram criadas:
   - Vá para **Table Editor** no Supabase Dashboard
   - Confirme que `badges` e `nutritionist_badges` estão listadas

2. Teste a aplicação:
   - Acesse uma página de nutricionista
   - O erro de relacionamento deve ter sido resolvido
   - As insígnias aparecerão quando atribuídas

## Atribuindo Badges a Nutricionistas

Para atribuir badges a nutricionistas, use o SQL Editor:

```sql
-- Exemplo: Atribuir badge "Nutricionista Verificado" a um nutricionista
INSERT INTO nutritionist_badges (nutritionist_id, badge_id)
SELECT 
    np.id as nutritionist_id,
    b.id as badge_id
FROM nutritionist_profiles np
CROSS JOIN badges b
WHERE np.email = 'email@nutricionista.com'
  AND b.name = 'Nutricionista Verificado';
```

## Troubleshooting

### Erro de Permissão
Se você receber erros de permissão, certifique-se de estar usando uma conta com privilégios de administrador no Supabase.

### Tabelas Já Existem
Se as tabelas já existirem, o script usará `CREATE TABLE IF NOT EXISTS` e `ON CONFLICT DO NOTHING` para evitar erros.

### RLS (Row Level Security)
As políticas de segurança estão configuradas para:
- Permitir leitura pública das badges
- Restringir modificações apenas a administradores

## Próximos Passos

1. Execute o script SQL
2. Reinicie a aplicação Next.js
3. Teste acessando uma página de nutricionista
4. Atribua badges conforme necessário
5. Customize as badges existentes ou crie novas conforme sua necessidade