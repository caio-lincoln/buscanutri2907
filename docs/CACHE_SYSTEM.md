# 🚀 Sistema de Cache e Otimização - BuscaNutri

## 📋 Visão Geral

Este documento descreve o sistema completo de cache e otimização implementado no projeto BuscaNutri,
incluindo controle de versão de build, revalidação de cache, configurações de qualidade de código e
fallbacks para recursos.

## 🏗️ Arquitetura do Sistema

### 1. **Controle de Versão de Build (BUILD_ID)**

#### Configuração (`next.config.mjs`)

```javascript
generateBuildId: async () => {
  const timestamp = new Date().toISOString()
  const hash = require('crypto')
    .createHash('md5')
    .update(timestamp + process.env.NODE_ENV)
    .digest('hex')
    .substring(0, 8)

  return `${process.env.NODE_ENV}-${hash}-${Date.now()}`
}
```

#### Funcionalidades:

- ✅ Build ID único para cada deploy
- ✅ Quebra automática de cache
- ✅ Versionamento baseado em timestamp + hash
- ✅ Diferenciação por ambiente (dev/prod)

### 2. **Headers de Cache Control**

#### Configuração Automática:

```javascript
headers: async () => [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
      { key: 'X-Build-ID', value: process.env.BUILD_ID || 'unknown' },
    ],
  },
  {
    source: '/_next/static/:path*',
    headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
  },
]
```

#### Estratégias por Tipo:

- **API Routes**: No-cache para dados dinâmicos
- **Static Assets**: Cache longo com immutable
- **Dashboard**: Cache curto com revalidação
- **Public Assets**: Cache médio com validação

### 3. **Revalidação de Cache por Tag/Rota**

#### Cache Manager (`lib/cache-utils.ts`)

```typescript
class CacheManager {
  // Revalidação por tag
  static async revalidateByTag(tag: string): Promise<void>

  // Revalidação por path
  static async revalidateByPath(path: string): Promise<void>

  // Flush completo
  static async flushAll(): Promise<void>
}
```

#### Tags Disponíveis:

- `nutritionists` - Dados de nutricionistas
- `dashboard` - Dados do dashboard
- `companies` - Dados de empresas
- `forum` - Dados do fórum
- `static` - Recursos estáticos

### 4. **Service Worker para Cache do Cliente**

#### Funcionalidades (`public/sw.js`):

- ✅ Cache de recursos estáticos
- ✅ Cache dinâmico para API
- ✅ Detecção de nova versão de build
- ✅ Atualização automática do cache
- ✅ Estratégias cache-first e network-first

#### Estratégias:

```javascript
// Cache First (recursos estáticos)
workbox.routing.registerRoute(
  /\/_next\/static\//,
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      /* ... */
    ],
  })
)

// Network First (API)
workbox.routing.registerRoute(
  /\/api\//,
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      /* ... */
    ],
  })
)
```

### 5. **Hook de Gerenciamento de Cache**

#### Uso (`hooks/use-cache-manager.ts`):

```typescript
const { updateAvailable, clearCache, applyUpdate, checkForUpdates, formatCacheSize } =
  useCacheManager()
```

#### Funcionalidades:

- ✅ Detecção de atualizações
- ✅ Limpeza manual de cache
- ✅ Aplicação de atualizações
- ✅ Monitoramento de tamanho
- ✅ Status de conectividade

## 🔧 Rota Administrativa

### Endpoint: `/api/admin/cache-flush`

#### POST - Flush de Cache:

```bash
curl -X POST "/api/admin/cache-flush" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "all"}'
```

#### Ações Disponíveis:

- `all` - Limpa todos os caches
- `tag` - Limpa por tag específica
- `path` - Limpa por path específico

#### GET - Status do Cache:

```bash
curl "/api/admin/cache-flush?secret=YOUR_ADMIN_SECRET"
```

## 🎨 Fallback de Imagens

### Componente: `ImageFallback`

#### Funcionalidades:

- ✅ Retry automático com backoff
- ✅ Cache de URLs que falharam
- ✅ Fallbacks por tipo (user, image, error)
- ✅ Componentes customizados
- ✅ Preload de imagens

#### Uso:

```tsx
<ImageFallback
  src={imageUrl}
  alt="Descrição"
  fallbackType="user"
  retryAttempts={3}
  retryDelay={1000}
  onError={error => console.log(error)}
/>
```

#### Componentes Específicos:

```tsx
// Avatar de usuário
<UserAvatar src={avatarUrl} name="João" size={40} />

// Imagem de conteúdo
<ContentImage src={imageUrl} alt="Conteúdo" />
```

## 🔍 Qualidade de Código

### 1. **ESLint Configuração Rigorosa**

#### Regras Implementadas:

- ✅ TypeScript strict mode
- ✅ Import/export organization
- ✅ Unused imports detection
- ✅ Cycle detection
- ✅ React best practices
- ✅ Accessibility rules

### 2. **TypeScript Strict Mode**

#### Configurações (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 3. **Pre-commit Hooks (Husky + lint-staged)**

#### Verificações Automáticas:

- ✅ ESLint com zero warnings
- ✅ Prettier formatting
- ✅ TypeScript type checking
- ✅ Import organization

#### Configuração (`.lintstagedrc.js`):

```javascript
module.exports = {
  '**/*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
    () => 'tsc --noEmit --strict',
  ],
}
```

## 🚀 CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)

#### Jobs Implementados:

1. **Quality Checks**
   - TypeScript strict check
   - ESLint strict check
   - Prettier check
   - Build verification

2. **Tests**
   - Unit tests (quando implementados)
   - Integration tests

3. **Deploy**
   - Build production
   - Cache flush automático
   - CDN purge (Cloudflare)

4. **Cache Maintenance**
   - Limpeza agendada (cron)
   - Monitoramento de performance

## 📊 Monitoramento e Métricas

### 1. **Cache Hit Rate**

```typescript
// Métricas disponíveis via Service Worker
const metrics = await getCacheMetrics()
console.log(`Hit Rate: ${metrics.hitRate}%`)
```

### 2. **Build Tracking**

```typescript
// Tracking de builds via headers
const buildId = response.headers.get('X-Build-ID')
console.log(`Current Build: ${buildId}`)
```

### 3. **Performance Monitoring**

```typescript
// Monitoramento de performance
const { formatCacheSize, cacheSize } = useCacheManager()
console.log(`Cache Size: ${formatCacheSize}`)
```

## 🔧 Comandos Úteis

### Desenvolvimento:

```bash
# Verificação completa de qualidade
npm run quality:check

# Limpeza de cache local
npm run cache:clear

# TypeScript strict check
npm run type-check:strict

# ESLint strict check
npm run lint:strict
```

### Produção:

```bash
# Flush de cache via API
curl -X POST "/api/admin/cache-flush" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{"action": "all"}'

# Verificar status do cache
curl "/api/admin/cache-flush?secret=$ADMIN_SECRET"
```

### Manutenção:

```bash
# Limpar cache do browser (via console)
window.clearImageFailureCache()

# Forçar atualização do Service Worker
navigator.serviceWorker.getRegistration().then(reg => reg.update())
```

## 🔐 Variáveis de Ambiente

### Obrigatórias:

```env
ADMIN_SECRET=your-admin-secret-key
```

### Opcionais:

```env
# Cloudflare CDN
CLOUDFLARE_API_TOKEN=your-cloudflare-token
CLOUDFLARE_ZONE_ID=your-zone-id

# Build tracking
BUILD_ID=auto-generated

# Cache settings
CACHE_MAX_AGE=3600
STATIC_CACHE_MAX_AGE=31536000
```

## 🚨 Troubleshooting

### Problemas Comuns:

1. **Cache não está sendo limpo**
   - Verificar ADMIN_SECRET
   - Confirmar headers de autorização
   - Checar logs do servidor

2. **Service Worker não atualiza**
   - Forçar atualização: `Ctrl+F5`
   - Limpar cache do browser
   - Verificar console para erros

3. **Imagens não carregam**
   - Verificar fallbacks configurados
   - Checar cache de URLs falhadas
   - Usar `clearImageFailureCache()`

4. **Build ID não muda**
   - Verificar configuração do `generateBuildId`
   - Confirmar variáveis de ambiente
   - Checar processo de build

## 📈 Próximos Passos

### Melhorias Planejadas:

- [ ] Cache distribuído com Redis
- [ ] Métricas avançadas com Analytics
- [ ] CDN automático para imagens
- [ ] Compressão avançada de assets
- [ ] Cache warming automático
- [ ] A/B testing para estratégias de cache

### Monitoramento:

- [ ] Dashboard de métricas de cache
- [ ] Alertas para cache miss alto
- [ ] Relatórios de performance
- [ ] Análise de uso de recursos

---

## 📞 Suporte

Para dúvidas ou problemas relacionados ao sistema de cache:

1. Verificar logs do servidor
2. Consultar este documento
3. Testar comandos de troubleshooting
4. Contatar a equipe de desenvolvimento

**Última atualização:** $(date) **Versão do sistema:** 1.0.0
