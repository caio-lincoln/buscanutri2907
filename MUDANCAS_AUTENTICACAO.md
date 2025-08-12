# Mudanças na Autenticação - SessionStorage

## Resumo das Alterações

Foi implementada uma mudança na configuração de autenticação para que o usuário seja automaticamente deslogado ao fechar o navegador, mas permaneça logado enquanto o navegador estiver aberto. Além disso, foi implementada sincronização do estado de autenticação entre abas.

## Arquivos Modificados

### 1. `lib/supabase.ts`
- **Mudança**: Configuração dos clientes Supabase para usar `sessionStorage` em vez de `localStorage`
- **Impacto**: A sessão agora expira quando o navegador é fechado
- **Configuração adicionada**:
  ```typescript
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
  ```

### 2. `hooks/use-auth-sync.ts` (NOVO)
- **Funcionalidade**: Hook personalizado para sincronizar estado de autenticação entre abas
- **Tecnologia**: Usa `BroadcastChannel` API para comunicação entre abas
- **Eventos sincronizados**:
  - `SIGN_IN`: Quando usuário faz login
  - `SIGN_OUT`: Quando usuário faz logout
  - `AUTH_STATE_CHANGED`: Quando token é renovado

### 3. `contexts/auth-context.tsx`
- **Mudanças principais**:
  - Integração com o hook `useAuthSync`
  - Reestruturação para separar perfis por tipo de usuário
  - Função `refreshUserData` para recarregar dados do usuário
  - Broadcast de eventos de logout para outras abas
  - Uso de `sessionStorage` para sessão de admin

### 4. `lib/auth.ts`
- **Mudança**: Substituição de `localStorage` por `sessionStorage` em todas as funções
- **Funções afetadas**:
  - `signOut()`: Remove sessão de admin do sessionStorage
  - `signInAdmin()`: Salva sessão de admin no sessionStorage
  - `isAdminUser()`: Verifica sessão de admin no sessionStorage
  - `getCurrentUser()`: Verifica sessão de admin no sessionStorage

## Comportamento Esperado

### ✅ Funcionalidades Implementadas

1. **Logout ao fechar navegador**: 
   - Usuário é automaticamente deslogado quando fecha o navegador
   - Sessão persiste apenas enquanto o navegador estiver aberto

2. **Sincronização entre abas**:
   - Login em uma aba atualiza todas as outras abas
   - Logout em uma aba desloga de todas as outras abas
   - Estado da navbar é atualizado em tempo real em todas as abas

3. **Compatibilidade com SSR**:
   - Verificações seguras para `window` e `sessionStorage`
   - Fallbacks para ambientes server-side

### 🔧 Tecnologias Utilizadas

- **SessionStorage**: Para armazenamento de sessão que expira com o navegador
- **BroadcastChannel**: Para comunicação entre abas do navegador
- **Supabase Auth**: Para gerenciamento de autenticação
- **React Context**: Para estado global de autenticação

### 🚨 Considerações Importantes

1. **BroadcastChannel**: Não suportado em todos os navegadores antigos (fallback implementado)
2. **SessionStorage**: Dados são perdidos ao fechar o navegador (comportamento desejado)
3. **Migração**: Usuários logados com localStorage precisarão fazer login novamente

## Como Testar

1. **Teste de logout ao fechar navegador**:
   - Faça login na aplicação
   - Feche o navegador completamente
   - Abra novamente - usuário deve estar deslogado

2. **Teste de sincronização entre abas**:
   - Abra a aplicação em duas abas
   - Faça login em uma aba
   - Verifique se a outra aba atualiza automaticamente
   - Faça logout em uma aba
   - Verifique se a outra aba também desloga

3. **Teste de persistência durante navegação**:
   - Faça login
   - Navegue entre páginas
   - Recarregue a página
   - Usuário deve permanecer logado

## Rollback (se necessário)

Para reverter as mudanças, substitua `sessionStorage` por `localStorage` nos arquivos modificados e remova a configuração de `storage` dos clientes Supabase.