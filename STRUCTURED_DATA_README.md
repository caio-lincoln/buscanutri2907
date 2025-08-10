# 🛡️ Sistema de Dados Estruturados - BuscaNutri

## 🎯 Objetivo

Este sistema foi implementado para **eliminar problemas de múltiplos escapes e JSON stringificado** que causavam corrupção de dados em campos estruturados como arrays e objetos.

## 🚀 Quick Start

### 1. Verificar Saúde dos Dados
```bash
npm run data:health-check
```

### 2. Monitorar Problemas
```bash
# Verificação única
npm run monitor:data

# Monitoramento contínuo
npm run monitor:data:watch
```

### 3. Migrar Dados Existentes
```bash
# Dry run (recomendado primeiro)
npm run migrate:structured-data

# Aplicar migração
npm run migrate:structured-data:apply
```

### 4. Executar Testes de Contrato
```bash
npm run test:contracts
```

## 📁 Estrutura do Sistema

```
lib/
├── structured-data-utils.ts      # Utilitários centralizados
├── api-validation-middleware.ts  # Validação de APIs
└── nutritionist-service.ts       # Serviços atualizados

scripts/
├── migrate-structured-data.ts    # Migração de dados
└── monitor-structured-data.ts    # Monitoramento

tests/
└── structured-data.contract.test.ts  # Testes de contrato

eslint-rules/
├── no-double-json.js            # Regra ESLint customizada
└── index.js                     # Plugin ESLint

docs/
└── structured-data-guide.md     # Guia completo

reports/
└── (relatórios gerados)         # Relatórios de monitoramento
```

## 🔧 Utilitários Principais

### Normalização
```typescript
import { 
  normalizeStringArray,
  normalizeLanguages,
  normalizeSpecialties 
} from '@/lib/structured-data-utils'

// Normalizar arrays genéricos
const services = normalizeStringArray(input, 'services')

// Normalizar idiomas (com padrões específicos)
const languages = normalizeLanguages(input)

// Normalizar especialidades médicas
const specialties = normalizeSpecialties(input)
```

### Validação
```typescript
import { validateStructuredPayload } from '@/lib/structured-data-utils'

const validation = validateStructuredPayload(data, 'nutritionist')
if (!validation.isValid) {
  console.error('Dados inválidos:', validation.errors)
}
```

## 🚨 Detecção de Problemas

### Padrões Detectados
- ❌ `JSON.stringify(JSON.stringify())` - Stringify duplo
- ❌ `JSON.parse(JSON.parse())` - Parse duplo  
- ❌ `\\"\\[\\\"item\\\"]\\\"` - Múltiplos escapes
- ❌ `"[\"item1\", \"item2\"]"` - Strings JSON

### Ferramentas
- **ESLint**: Detecta padrões no código
- **Monitoramento**: Verifica banco de dados
- **Testes**: Valida fluxo completo

## 📊 Campos Estruturados

### Nutricionistas
- `specialties: string[]`
- `languages: string[]` 
- `services: string[]`
- `certifications: string[]`
- `achievements: string[]`
- `working_hours: object`
- `social_media: object`
- `addresses: object[]`

### Usuários
- `preferences: string[]`
- `dietary_restrictions: string[]`
- `health_conditions: string[]`

### Empresas
- `services: string[]`
- `locations: object[]`
- `contact_methods: string[]`

## ✅ Boas Práticas

### ✅ FAZER
```typescript
// Trabalhar com arrays diretamente
const languages = ['Português', 'Inglês']

// Usar utilitários de normalização
const normalized = normalizeLanguages(input)

// Validar antes de enviar
const validation = validateStructuredPayload(data, 'nutritionist')
```

### ❌ NÃO FAZER
```typescript
// Stringificar manualmente
const languages = JSON.stringify(['Português', 'Inglês']) // ❌

// Parse sem validação
const parsed = JSON.parse(someString) // ❌

// Limpeza manual de escapes
const cleaned = data.replace(/\\"/g, '"') // ❌
```

## 🔍 Monitoramento

### Métricas Importantes
- Número de normalizações por dia
- Tipos de problemas mais comuns
- Taxa de erro de validação
- Tempo de resposta das APIs

### Alertas
- Mais de 10 problemas detectados
- Problemas de severidade alta
- Dados corrompidos no banco

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run lint                    # Verificar código
npm run type-check             # Verificar tipos

# Dados estruturados
npm run monitor:data           # Verificação única
npm run monitor:data:watch     # Monitoramento contínuo
npm run monitor:data:fix       # Correção automática (cuidado!)
npm run migrate:structured-data # Migração (dry-run)
npm run test:contracts         # Testes de contrato
npm run data:health-check      # Verificação completa

# Qualidade
npm run quality:check          # Verificação completa de qualidade
```

## 🚀 Próximos Passos

1. **Instalar dependências**: `npm install`
2. **Verificar saúde**: `npm run data:health-check`
3. **Migrar dados**: `npm run migrate:structured-data:apply`
4. **Configurar monitoramento**: `npm run monitor:data:watch`
5. **Ler guia completo**: [docs/structured-data-guide.md](docs/structured-data-guide.md)

## 📞 Suporte

1. Consulte o [guia completo](docs/structured-data-guide.md)
2. Execute `npm run data:health-check`
3. Verifique logs em `./reports/`
4. Entre em contato com a equipe técnica

---

**Princípio**: Dados estruturados são sempre arrays/objetos, nunca strings JSON! 🎯