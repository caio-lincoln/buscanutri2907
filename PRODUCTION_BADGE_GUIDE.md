# Guia de Operações de Badge em Produção

## Problema Resolvido
O sistema agora implementa verificações de segurança para operações críticas de badges em ambiente de produção, seguindo as regras de workspace definidas.

## Como Funciona

### 1. Verificação de Ambiente
O sistema detecta automaticamente se está rodando em produção através da variável `NODE_ENV`.

### 2. Autorização Necessária
Para executar operações críticas em produção, é necessário fornecer autorização através de:

**Opção A - Header HTTP:**
```
x-production-auth: #liberar_producao
```

**Opção B - Campo no Body da Requisição:**
```json
{
  "production_auth": "#liberar_producao",
  // ... outros campos
}
```

### 3. Operações Protegidas
As seguintes operações agora requerem autorização em produção:

- **Criar Badge** (`POST /api/admin/badges`)
- **Atualizar Badge** (`PUT /api/admin/badges`)
- **Deletar Badge** (`DELETE /api/admin/badges`)
- **Atribuir Badge** (`POST /api/admin/badges/assign`)
- **Remover Badge** (`DELETE /api/admin/badges/assign`)

### 4. Log de Operações
Todas as operações críticas em produção são registradas automaticamente com:
- Tipo da operação
- ID do recurso afetado
- ID do usuário que executou
- Timestamp da operação

## Como Usar

### Para Desenvolvimento
Em ambiente de desenvolvimento (`NODE_ENV !== 'production'`), as operações funcionam normalmente sem necessidade de autorização adicional.

### Para Produção
Em ambiente de produção, adicione a autorização nas suas requisições:

**Exemplo com Header:**
```javascript
fetch('/api/admin/badges', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-production-auth': '#liberar_producao'
  },
  body: JSON.stringify({
    name: 'Nova Badge',
    description: 'Descrição da badge',
    icon_url: 'https://example.com/icon.png'
  })
})
```

**Exemplo com Body:**
```javascript
fetch('/api/admin/badges', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Nova Badge',
    description: 'Descrição da badge',
    icon_url: 'https://example.com/icon.png',
    production_auth: '#liberar_producao'
  })
})
```

## Mensagens de Erro

### Sem Autorização
```json
{
  "error": "Operação crítica em produção requer autorização. Adicione '#liberar_producao' no header 'x-production-auth' ou no campo 'production_auth' do body."
}
```
Status: `403 Forbidden`

### Autorização Inválida
```json
{
  "error": "Autorização de produção inválida para [operação]. Token esperado: '#liberar_producao'"
}
```
Status: `403 Forbidden`

## Arquivos Modificados

1. **`lib/production-auth.ts`** - Utilitário de verificação de produção
2. **`app/api/admin/badges/route.ts`** - Rotas principais de badges
3. **`app/api/admin/badges/assign/route.ts`** - Rotas de atribuição de badges

## Segurança
- ✅ Operações críticas protegidas em produção
- ✅ Log automático de todas as operações
- ✅ Verificação de permissões de admin mantida
- ✅ Validação de dados mantida
- ✅ Tratamento de erros robusto