# Guia de Dados Estruturados - BuscaNutri

## 📋 Visão Geral

Este guia estabelece o padrão para manipulação de campos estruturados (arrays e objetos) no sistema
BuscaNutri. O objetivo é **eliminar problemas de múltiplos escapes e JSON stringificado** que causam
corrupção de dados.

## 🎯 Princípio Fundamental

> **Campos estruturados são SEMPRE arrays/objetos; NUNCA strings JSON no front-end**

## 📊 Campos Estruturados Identificados

### Perfis de Nutricionistas

- `specialties: string[]` - Especialidades médicas
- `languages: string[]` - Idiomas falados
- `services: string[]` - Serviços oferecidos
- `certifications: string[]` - Certificações e títulos
- `achievements: string[]` - Conquistas profissionais
- `working_hours: object` - Horários de trabalho
- `social_media: object` - Redes sociais
- `addresses: object[]` - Endereços de atendimento

### Perfis de Usuários

- `preferences: string[]` - Preferências alimentares
- `dietary_restrictions: string[]` - Restrições dietéticas
- `health_conditions: string[]` - Condições de saúde

### Perfis de Empresas

- `services: string[]` - Serviços oferecidos
- `locations: object[]` - Localizações
- `contact_methods: string[]` - Métodos de contato

## ✅ O Que PODE Fazer

### ✅ Front-end

```typescript
// ✅ CORRETO: Trabalhar com arrays diretamente
const languages = ['Português', 'Inglês', 'Espanhol']
const specialties = ['Nutrição Esportiva', 'Emagrecimento']

// ✅ CORRETO: Usar utilitários de normalização
import { normalizeLanguages, normalizeSpecialties } from '@/lib/structured-data-utils'

const normalizedLanguages = normalizeLanguages(userInput)
const normalizedSpecialties = normalizeSpecialties(userInput)

// ✅ CORRETO: Validar antes de enviar
import { validateStructuredPayload } from '@/lib/structured-data-utils'

const validation = validateStructuredPayload(formData, 'nutritionist')
if (!validation.isValid) {
  console.error('Dados inválidos:', validation.errors)
  return
}
```

### ✅ Back-end/API

```typescript
// ✅ CORRETO: Usar middleware de validação
import { validateApiPayload } from '@/lib/api-validation-middleware'

export async function POST(request: Request) {
  const body = await request.json()

  const validation = validateApiPayload(body, 'nutritionist')
  if (!validation.isValid) {
    return Response.json({ errors: validation.errors }, { status: 400 })
  }

  // Dados já estão normalizados e validados
  const result = await saveNutritionist(body)
  return Response.json(result)
}

// ✅ CORRETO: Usar serialização segura
import { safeStringify } from '@/lib/structured-data-utils'

const jsonString = safeStringify(data) // Não faz stringify duplo
```

### ✅ Banco de Dados

```sql
-- ✅ CORRETO: Usar tipos JSON/JSONB
CREATE TABLE nutritionist_profiles (
  id UUID PRIMARY KEY,
  specialties JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  services JSONB DEFAULT '[]'::jsonb,
  working_hours JSONB DEFAULT '{}'::jsonb
);

-- ✅ CORRETO: Inserir arrays diretamente
INSERT INTO nutritionist_profiles (specialties, languages)
VALUES (
  '["Nutrição Esportiva", "Emagrecimento"]'::jsonb,
  '["Português", "Inglês"]'::jsonb
);
```

## ❌ O Que NÃO PODE Fazer

### ❌ Front-end

```typescript
// ❌ ERRADO: Stringificar arrays manualmente
const languages = JSON.stringify(['Português', 'Inglês']) // NÃO!

// ❌ ERRADO: Fazer parse manual sem validação
const parsed = JSON.parse(someString) // Perigoso!

// ❌ ERRADO: Usar replace manual para limpar escapes
const cleaned = data.replace(/\\"/g, '"') // Use utilitários!

// ❌ ERRADO: Enviar strings que parecem JSON
const formData = {
  languages: '["Português", "Inglês"]', // NÃO!
}
```

### ❌ Back-end/API

```typescript
// ❌ ERRADO: Fazer stringify duplo
const data = JSON.stringify(JSON.stringify(array)) // NÃO!

// ❌ ERRADO: Aceitar strings JSON sem validação
const languages = body.languages // Se for string JSON, rejeitar!

// ❌ ERRADO: Parse sem tratamento de erro
const parsed = JSON.parse(data) // Pode quebrar!
```

### ❌ Banco de Dados

```sql
-- ❌ ERRADO: Usar TEXT para dados estruturados
CREATE TABLE profiles (
  specialties TEXT -- NÃO! Use JSONB
);

-- ❌ ERRADO: Inserir strings JSON escapadas
INSERT INTO profiles (specialties)
VALUES ('"[\"Nutrição\", \"Esportiva\"]"'); -- NÃO!
```

## 🛠️ Utilitários Disponíveis

### Normalização

```typescript
import {
  normalizeStringArray,
  normalizeLanguages,
  normalizeSpecialties,
  normalizeJsonObject,
} from '@/lib/structured-data-utils'

// Para arrays genéricos
const services = normalizeStringArray(input, 'services')

// Para idiomas (com padrões específicos)
const languages = normalizeLanguages(input)

// Para especialidades médicas
const specialties = normalizeSpecialties(input)

// Para objetos JSON
const workingHours = normalizeJsonObject(input, 'working_hours')
```

### Validação

```typescript
import { validateStructuredPayload } from '@/lib/structured-data-utils'

const validation = validateStructuredPayload(data, 'nutritionist')
if (!validation.isValid) {
  console.error('Erros encontrados:', validation.errors)
}
```

### Serialização Segura

```typescript
import { safeStringify } from '@/lib/structured-data-utils'

// Não faz stringify duplo
const json = safeStringify(data)
```

### Telemetria

```typescript
import { logNormalizationEvent } from '@/lib/structured-data-utils'

// Registra eventos para monitoramento
logNormalizationEvent('data_normalized', {
  field: 'languages',
  original_type: 'string',
  final_type: 'array',
})
```

## 🔍 Detecção de Problemas

### Padrões de Risco

O sistema detecta automaticamente:

1. **JSON Duplo**: `JSON.stringify(JSON.stringify())`
2. **Parse Duplo**: `JSON.parse(JSON.parse())`
3. **Múltiplos Escapes**: `\\"\\[\\\"item\\\"]\\"`
4. **Strings JSON**: `"[\"item1\", \"item2\"]"`

### Ferramentas de Monitoramento

#### ESLint (Desenvolvimento)

```bash
# Detecta padrões de risco no código
npm run lint
```

#### Monitoramento Contínuo

```bash
# Executa verificação única
npm run monitor:data

# Inicia monitoramento contínuo
npm run monitor:data:watch

# Correção automática (cuidado!)
npm run monitor:data:fix
```

#### Testes de Contrato

```bash
# Valida fluxo completo de dados
npm run test:contracts
```

## 🚨 Alertas e Correções

### Quando Alertas São Disparados

- Mais de 10 problemas detectados
- Problemas de severidade alta encontrados
- Dados corrompidos no banco

### Correção Manual

```typescript
// Para um registro específico
import { StructuredDataMonitor } from '@/scripts/monitor-structured-data'

const monitor = new StructuredDataMonitor(config)
await monitor.fixRecord('nutritionist_profiles', 'record-id')
```

### Migração de Dados Existentes

```bash
# Executa migração completa (dry-run)
npm run migrate:structured-data

# Executa migração real
npm run migrate:structured-data --apply
```

## 📝 Exemplos Práticos

### Formulário de Cadastro

```typescript
// ✅ CORRETO
function NutritionistForm() {
  const [languages, setLanguages] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])

  const handleSubmit = async (data: FormData) => {
    // Normalizar dados antes de enviar
    const normalizedData = {
      ...data,
      languages: normalizeLanguages(data.languages),
      specialties: normalizeSpecialties(data.specialties)
    }

    // Validar payload
    const validation = validateStructuredPayload(normalizedData, 'nutritionist')
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    // Enviar dados normalizados
    await submitForm(normalizedData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <MultiSelect
        value={languages}
        onChange={setLanguages} // Sempre array
        options={languageOptions}
      />
      <MultiSelect
        value={specialties}
        onChange={setSpecialties} // Sempre array
        options={specialtyOptions}
      />
    </form>
  )
}
```

### API Route

```typescript
// ✅ CORRETO
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar payload estruturado
    const validation = validateApiPayload(body, 'nutritionist')
    if (!validation.isValid) {
      return Response.json(
        { error: 'Dados inválidos', details: validation.errors },
        { status: 400 }
      )
    }

    // Salvar no banco (dados já normalizados)
    const { data, error } = await supabase
      .from('nutritionist_profiles')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    logNormalizationEvent('api_error', error.message, error.message, false)
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
```

### Exibição de Dados

```typescript
// ✅ CORRETO
function NutritionistProfile({ nutritionist }) {
  // Normalizar dados vindos do banco (por segurança)
  const languages = normalizeLanguages(nutritionist.languages)
  const specialties = normalizeSpecialties(nutritionist.specialties)

  return (
    <div>
      <h3>Idiomas</h3>
      <ul>
        {languages.map(lang => (
          <li key={lang}>{lang}</li>
        ))}
      </ul>

      <h3>Especialidades</h3>
      <ul>
        {specialties.map(spec => (
          <li key={spec}>{spec}</li>
        ))}
      </ul>
    </div>
  )
}
```

## 🔄 Fluxo de Dados Recomendado

```
📝 Formulário → 🔧 Normalização → ✅ Validação → 🌐 API → 🗄️ Banco (JSONB)
     ↓              ↓              ↓         ↓         ↓
   Array[]      Array[]        Array[]   Array[]   JSONB
```

## 📊 Monitoramento e Métricas

### Métricas Importantes

- Número de normalizações por dia
- Tipos de problemas mais comuns
- Tempo de resposta das APIs
- Taxa de erro de validação

### Dashboards

- Grafana: Métricas em tempo real
- Logs: Eventos de normalização
- Alertas: Problemas críticos

## 🚀 Próximos Passos

1. **Implementar**: Aplicar padrões em novos desenvolvimentos
2. **Migrar**: Executar migração de dados existentes
3. **Monitorar**: Configurar alertas e dashboards
4. **Treinar**: Educar equipe sobre padrões
5. **Iterar**: Melhorar utilitários baseado no uso

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte este guia primeiro
2. Verifique logs de monitoramento
3. Execute testes de contrato
4. Entre em contato com a equipe técnica

---

**Lembre-se**: Dados estruturados são sempre arrays/objetos, nunca strings JSON! 🎯
