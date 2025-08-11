# Correções para Deploy no Vercel

Este documento descreve as melhorias implementadas para resolver problemas comuns de deploy no Vercel.

## 📋 Resumo das Correções Implementadas

### ✅ Problemas Resolvidos

1. **Hidratação SSR**: Componente `ClientOnly` e hooks seguros
2. **Classes Dinâmicas Tailwind**: Safelist abrangente no `tailwind.config.js`
3. **Imagens Externas**: Configuração otimizada no `next.config.mjs` e `vercel.json`
4. **Configurações de Deploy**: Otimizações específicas para Vercel
5. **APIs do Browser**: Verificações seguras para SSR em todos os componentes

### 🔧 Componentes Atualizados para SSR

- `components/ui/use-mobile.tsx` - Hook `useIsMobile` com verificações seguras
- `components/ui/sidebar.tsx` - Event listeners e cookies seguros
- `components/dashboard/nutricionistas/applications-tab.tsx` - Navegação com Next.js router
- `components/dashboard/nutricionistas/blog-tab.tsx` - `window.confirm` seguro
- `components/dashboard/admin/badges-tab.tsx` - `window.confirm` seguro
- `components/ui/advanced-image-upload.tsx` - `document.createElement` seguro
- `components/dashboard/empresa/reports-tab.tsx` - Download de arquivos seguro
- `components/ui/content-renderer.tsx` - Scripts externos seguros
- `lib/cache-utils.ts` - Acesso ao storage seguro

## Problemas Resolvidos

### 1. Dados/Flags Diferentes no SSR

**Problema**: Diferenças entre renderização no servidor e cliente causando problemas de hidratação.

**Soluções Implementadas**:

- **Componente ClientOnly** (`components/client-only.tsx`):
  - Wrapper que só renderiza no cliente
  - Hooks seguros para localStorage e sessionStorage
  - Hook `useIsClient()` para verificar se está no cliente

- **Hooks Atualizados**:
  - `hooks/use-local-storage.ts`: Agora sempre inicia com `initialValue` no servidor
  - Carregamento do localStorage apenas no cliente via `useEffect`

- **Verificações Seguras**:
  - `lib/auth.ts`: Verificações `typeof window !== 'undefined' && window.localStorage`
  - `lib/profile-views-service.ts`: Verificações para `sessionStorage` e `navigator`
  - `lib/cache-utils.ts`: Try/catch para operações de storage

### 2. Classes Dinâmicas do Tailwind Removidas

**Problema**: Tailwind CSS removendo classes dinâmicas durante o build.

**Soluções Implementadas**:

- **Safelist Abrangente** (`tailwind.config.ts`):
  - Cores personalizadas: `bg-[#1E1D40]`, `text-[#4AB0D9]`, etc.
  - Variações de opacidade: `bg-opacity-*`, `text-opacity-*`
  - Classes de validação: `text-red-500`, `text-green-500`, `border-red-300`
  - Status e estados: `bg-yellow-100`, `bg-green-100`, `bg-red-100`
  - Tamanhos dinâmicos: `w-*`, `h-*`, `text-*`, `p-*`, `m-*`
  - Posicionamento: `top-*`, `left-*`, `right-*`, `bottom-*`
  - Flexbox e Grid: `flex-*`, `grid-cols-*`, `gap-*`
  - Transformações: `scale-*`, `rotate-*`, `translate-*`
  - Transições: `transition-*`, `duration-*`, `ease-*`
  - Sombras: `shadow-*`, `drop-shadow-*`
  - Animações: `animate-*`

### 3. Imagens Externas Bloqueadas

**Problema**: `next/image` bloqueando imagens externas por falta de configuração.

**Soluções Implementadas**:

- **next.config.mjs Atualizado**:
  - `images.unoptimized: false` (habilitado para produção)
  - `remotePatterns` específicos para domínios confiáveis:
    - Supabase Storage
    - CDNs comuns (Cloudinary, AWS S3, etc.)
    - Domínios de imagem conhecidos
  - Configurações de segurança e performance

- **vercel.json Otimizado**:
  - Headers de segurança
  - Cache otimizado para assets estáticos
  - Configurações de função com timeout adequado
  - Regiões específicas para melhor performance

## Configurações Adicionais

### Variáveis de Ambiente (.env.production)

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_RUNTIME=nodejs
NEXT_PRIVATE_STANDALONE=true
NEXT_SSR_CACHE=true
NEXT_STATIC_GENERATION=true
```

### Headers de Segurança

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: origin-when-cross-origin`

### Cache Otimizado

- API routes: `no-store, no-cache, must-revalidate`
- Assets estáticos: `public, max-age=31536000, immutable`
- Páginas: Cache inteligente baseado no conteúdo

## Como Usar

### 1. Componente ClientOnly

```tsx
import { ClientOnly } from '@/components/client-only'

function MyComponent() {
  return (
    <ClientOnly fallback={<div>Carregando...</div>}>
      <ComponenteQueUsaLocalStorage />
    </ClientOnly>
  )
}
```

### 2. Hook useIsClient

```tsx
import { useIsClient } from '@/components/client-only'

function MyComponent() {
  const isClient = useIsClient()
  
  if (!isClient) {
    return <div>Carregando...</div>
  }
  
  return <div>Conteúdo do cliente</div>
}
```

### 3. Hooks de Storage Seguros

```tsx
import { useLocalStorage, useSessionStorage } from '@/components/client-only'

function MyComponent() {
  const [value, setValue] = useLocalStorage('key', 'defaultValue')
  const [sessionValue, setSessionValue] = useSessionStorage('sessionKey', {})
  
  // Uso normal, sem preocupações com SSR
}
```

## Verificações de Deploy

Antes do deploy, verifique:

1. ✅ Todas as classes Tailwind dinâmicas estão na safelist
2. ✅ Componentes que usam APIs do browser estão envolvidos em ClientOnly
3. ✅ Variáveis de ambiente estão configuradas no Vercel
4. ✅ Domínios de imagem estão nos remotePatterns
5. ✅ Build local funciona sem erros: `npm run build`

## Monitoramento

Para monitorar problemas de hidratação em produção:

1. Verifique o console do browser para warnings de hidratação
2. Use React DevTools para identificar componentes problemáticos
3. Monitore logs do Vercel para erros de build
4. Teste em diferentes navegadores e dispositivos

## Troubleshooting

### Erro de Hidratação

Se ainda houver erros de hidratação:

1. Identifique o componente problemático
2. Envolva-o com `<ClientOnly>`
3. Use `useIsClient()` para renderização condicional
4. Verifique se não há diferenças entre servidor e cliente

### Classes Tailwind Removidas

Se classes ainda estão sendo removidas:

1. Adicione-as à safelist em `tailwind.config.ts`
2. Use classes completas em vez de concatenação quando possível
3. Verifique se o padrão está correto na safelist

### Imagens Não Carregam

Se imagens externas não carregam:

1. Adicione o domínio aos `remotePatterns` em `next.config.mjs`
2. Verifique se a URL da imagem está correta
3. Teste localmente com `npm run build && npm start`