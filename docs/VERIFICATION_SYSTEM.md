# Sistema de Verificação de Nutricionistas

## Visão Geral

Este documento descreve a implementação do sistema de verificação de nutricionistas no painel administrativo.

## Funcionalidades Implementadas

### 1. Serviços de Dados (`lib/admin-data-service.ts`)

#### `getAllUsers()`
- Busca todos os usuários com informações de verificação
- Inclui `is_verified` e `nutritionist_profiles` com IDs
- Usa FKs explícitas para melhor performance

#### `getNutritionistDocuments(nutritionistProfileId: string)`
- Busca documentos de um nutricionista específico
- Retorna URLs públicas dos arquivos
- Ordena por data de criação

#### `approveNutritionist(userId: string, nutritionistProfileId: string)`
- Atualiza `users.is_verified = true`
- Define `nutritionist_profiles.verified_at = now()`
- Executa em transação (duas operações sequenciais)

#### `rejectNutritionist()`
- MVP: apenas log do motivo
- TODO: implementar envio de e-mail e registro de log

### 2. Componente de Modal (`components/dashboard/admin/VerifyNutritionistModal.tsx`)

#### Características:
- Modal responsivo com scroll
- Grid de cards para documentos
- Preview de imagens com fallback
- Botões de ação (Aprovar/Rejeitar)
- Formulário de motivo para rejeição
- Estados de loading e feedback

#### Props:
```typescript
interface VerifyNutritionistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    email: string
    name?: string | null
    nutritionistProfileId: string
  }
  onApproved: () => void
}
```

### 3. Tabela de Usuários Atualizada (`components/dashboard/admin/users-tab.tsx`)

#### Novas Funcionalidades:
- Coluna "Verificado" com badges visuais
- Botão "Verificar" no menu de ações para nutricionistas pendentes
- Integração com modal de verificação
- Refetch automático após aprovação

#### Condições para Exibir Botão "Verificar":
- `user_type === 'nutricionista'`
- `is_verified === false`
- `nutritionist_profiles?.[0]?.id` existe

### 4. Helpers de Storage (`lib/storage.ts`)

#### Funções Utilitárias:
- `publicUrlFromStoragePath()`: Gera URLs públicas
- `isImageFile()`: Verifica se arquivo é imagem
- `getDocumentTypeLabel()`: Mapeia tipos para labels amigáveis

### 5. Tipos Centralizados (`lib/types.ts`)

Todas as interfaces foram centralizadas para melhor organização e reutilização.

## Estrutura do Banco de Dados

### Tabelas Utilizadas:

#### `users`
- `id` (uuid, PK)
- `email` (text)
- `user_type` (text: 'paciente' | 'nutricionista' | 'empresa')
- `is_verified` (boolean, default false)
- `created_at` (timestamptz)
- `last_sign_in_at` (timestamptz)

#### `nutritionist_profiles`
- `id` (uuid, PK)
- `user_id` (uuid, FK -> users.id)
- `full_name` (text)
- `verified_at` (timestamptz, null)

#### `nutritionist_documents`
- `id` (uuid, PK)
- `nutritionist_id` (uuid, FK -> nutritionist_profiles.id)
- `document_type` (text)
- `title` (text, null)
- `file_name` (text - chave no Storage)

### Storage:
- Bucket: `nutritionist_documents`
- URLs públicas geradas automaticamente

## Fluxo de Verificação

1. **Admin acessa painel** → Lista de usuários carregada
2. **Identifica nutricionista pendente** → Badge "Pendente" visível
3. **Clica em "Verificar"** → Modal abre com documentos
4. **Revisa documentos** → Preview de imagens e links para arquivos
5. **Decide:**
   - **Aprovar** → `is_verified = true`, `verified_at = now()`
   - **Rejeitar** → Formulário de motivo, log registrado
6. **Feedback visual** → Toast de sucesso/erro
7. **Tabela atualizada** → Refetch automático

## Estados Visuais

### Badges de Verificação:
- **Verificado**: Verde com ícone de check
- **Pendente**: Amarelo com borda
- **N/A**: Cinza para não-nutricionistas

### Cards de Documentos:
- **Imagens**: Preview com fallback para ícone
- **Outros arquivos**: Ícone de documento
- **Hover**: Efeito de escala sutil
- **Glassmorphism**: Fundo translúcido

## Tratamento de Erros

- **Silent error handling**: Erros não quebram a UI
- **Toasts informativos**: Feedback claro para o usuário
- **Fallbacks visuais**: Ícones quando imagens falham
- **Estados de loading**: Indicadores durante operações

## Próximos Passos (TODO)

1. **Sistema de E-mail**: Notificar nutricionistas sobre aprovação/rejeição
2. **Log de Verificações**: Tabela `verification_logs` para auditoria
3. **Políticas RLS**: Configurar permissões adequadas
4. **Testes**: Implementar testes unitários e de integração
5. **Notificações Push**: Alertas em tempo real para admins

## Considerações de Segurança

- Verificação de permissões de admin
- Validação de tipos de arquivo
- Sanitização de inputs
- Rate limiting para operações sensíveis

## Performance

- Queries otimizadas com FKs explícitas
- Lazy loading de documentos
- Debounce em operações de busca
- Cache de URLs públicas
