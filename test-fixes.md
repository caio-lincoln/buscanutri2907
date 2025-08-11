# Relatório de Correção de Bugs

## Bugs Corrigidos

### 1. Horários do Nutricionista não Salvam

**Problema identificado:**

- O sistema salvava horários como JSON no campo `available_times` do perfil
- Não havia sincronização com a tabela `nutritionist_availability`
- Incompatibilidade entre formato do ScheduleSelector e estrutura do banco

**Correções implementadas:**

1. **Criado novo serviço de disponibilidade** (`lib/availability-service.ts`):
   - Função `convertScheduleToAvailability()` - converte objeto do ScheduleSelector para slots
     individuais
   - Função `saveNutritionistAvailability()` - salva horários na tabela `nutritionist_availability`
   - Função `getNutritionistAvailability()` - carrega horários da tabela e converte para formato do
     ScheduleSelector

2. **Atualizado serviço de perfil** (`lib/profile-service.ts`):
   - Integração com o novo serviço de disponibilidade
   - Processamento separado dos horários antes de salvar o perfil
   - Salvamento automático na tabela `nutritionist_availability` após atualizar perfil

3. **Atualizado modal de perfil** (`components/user-profile-modal.tsx`):
   - Função `loadNutritionistAvailability()` para carregar horários da tabela específica
   - Carregamento automático dos horários ao abrir o modal

**Resultado esperado:**

- Horários agora são salvos corretamente na tabela `nutritionist_availability`
- Carregamento dos horários funciona a partir da tabela específica
- Compatibilidade mantida com o componente ScheduleSelector

### 2. Respostas de Perguntas do Nutricionista não Funcionam

**Problema identificado:**

- Políticas RLS muito restritivas na tabela `forum_answers`
- Referência a campo inexistente (`status`) na política de INSERT
- Falta de logs para debug

**Correções implementadas:**

1. **Corrigidas políticas RLS** (migração `fix_forum_answers_rls_policies_v2`):
   - Removidas políticas antigas com referências incorretas
   - Criadas políticas mais simples e robustas
   - Política de INSERT verifica apenas se usuário é nutricionista (sem campo `status`)

2. **Melhorada função `createForumAnswer`** (`lib/forum-data.ts`):
   - Adicionados logs detalhados para debug
   - Melhor tratamento de erros
   - Verificações mais claras do fluxo de execução

**Resultado esperado:**

- Nutricionistas podem responder perguntas no fórum
- Logs ajudam a identificar problemas futuros
- Políticas RLS funcionam corretamente

## Como Testar

### Teste 1: Horários do Nutricionista

1. Faça login como nutricionista
2. Abra o modal de perfil
3. Configure horários no ScheduleSelector
4. Salve o perfil
5. Verifique se os horários aparecem corretamente ao reabrir o modal
6. Confirme no banco que os dados estão na tabela `nutritionist_availability`

### Teste 2: Respostas do Fórum

1. Faça login como nutricionista
2. Acesse uma pergunta no fórum
3. Tente responder a pergunta
4. Verifique se a resposta é salva e aparece na interface
5. Confira os logs no console para debug

## Arquivos Modificados

- `lib/availability-service.ts` (novo)
- `lib/profile-service.ts` (atualizado)
- `lib/forum-data.ts` (atualizado)
- `components/user-profile-modal.tsx` (atualizado)
- Migração: `fix_forum_answers_rls_policies_v2`

## Observações

- As correções mantêm compatibilidade com o código existente
- Logs adicionados para facilitar debug futuro
- Estrutura do banco otimizada para horários de disponibilidade
- Políticas RLS simplificadas e mais robustas
