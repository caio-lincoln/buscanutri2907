# BuscaNutri

Sistema de busca e recomendação nutricional.

## Sistema de Armazenamento

Este projeto utiliza um sistema de armazenamento moderno e seguro que substitui o uso direto do `localStorage`.

### Características

- **Múltiplos Adapters**: IndexedDB (primário), SessionStorage (fallback), Memory (último recurso)
- **Migração Automática**: Sistema de versioning e migração de dados
- **Validação de Dados**: Esquemas de validação para diferentes tipos de dados
- **Segurança**: Detecção e bloqueio de dados sensíveis
- **Fallback Seguro**: Degradação graceful quando adapters não estão disponíveis

### Uso Básico

```typescript
import { storage } from '@/lib/storage'

// Armazenar dados
await storage.set('user_preferences', { theme: 'dark', language: 'pt' })

// Recuperar dados
const preferences = await storage.get('user_preferences', { theme: 'light' })

// Remover dados
await storage.remove('user_preferences')

// Limpar todos os dados
await storage.clear()
```

### Hook para React

```typescript
import { useStorage } from '@/lib/storage'

function MyComponent() {
  const [preferences, setPreferences] = useStorage('user_preferences', {
    theme: 'light',
    language: 'pt'
  })

  return (
    <button onClick={() => setPreferences({ ...preferences, theme: 'dark' })}>
      Alternar Tema
    </button>
  )
}
```

### Validação de Dados

O sistema inclui validação automática para tipos conhecidos:

```typescript
// Dados válidos - será aceito
await storage.set('user_profile', {
  id: 'user123',
  email: 'user@example.com',
  name: 'João Silva',
  user_type: 'client'
}, 'userProfile')

// Dados inválidos - será rejeitado
await storage.set('user_profile', {
  id: 123, // Deve ser string
  email: 'user@example.com'
  // name e user_type ausentes
}, 'userProfile')
```

### Migração de Dados

O sistema executa migrações automaticamente na inicialização:

- **Versão 0 → 1**: Remove dados legados do localStorage
- **Versão 1 → 2**: Reestrutura dados existentes com metadados

### Segurança

O sistema bloqueia automaticamente dados sensíveis:

```typescript
// Será rejeitado - contém dados sensíveis
await storage.set('user_data', {
  name: 'João',
  password: 'secret123' // ❌ Dados sensíveis detectados
})

// Será aceito - dados seguros
await storage.set('user_data', {
  name: 'João',
  preferences: { theme: 'dark' }
})
```

### Desenvolvimento

#### Executar Testes

```bash
npm test
```

#### Verificar Ausência de localStorage

```bash
node scripts/check-no-localstorage.js
```

#### Build

```bash
npm run build
```

#### Desenvolvimento

```bash
npm run dev
```

### Estrutura do Sistema de Storage

```
lib/storage/
├── index.ts                 # Exportações principais
├── types.ts                 # Interfaces e tipos
├── storage-service.ts       # Serviço principal
├── migrations.ts            # Sistema de migração
├── validation.ts            # Validação e segurança
└── adapters/
    ├── session-storage-adapter.ts
    ├── indexeddb-adapter.ts
    └── memory-adapter.ts
```

### Arquivos de Teste

```
__tests__/storage/
├── adapters.test.ts         # Testes dos adapters
├── migrations.test.ts       # Testes de migração
├── validation.test.ts       # Testes de validação
└── storage-service.test.ts  # Testes do serviço principal
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
