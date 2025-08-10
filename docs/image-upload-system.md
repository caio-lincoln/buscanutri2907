# Sistema de Upload e Crop de Imagens

## Visão Geral

Este documento descreve o sistema completo de upload e edição de imagens implementado para perfis de
usuários (nutricionistas, empresas e pacientes), incluindo funcionalidades de crop,
redimensionamento e otimização.

## Funcionalidades Implementadas

### 1. Seção "Capa do Perfil" (apenas nutricionistas)

#### Características:

- **Preview da capa atual** com placeholder quando não há imagem
- **Upload via drag & drop + botão selecionar**
- **Editor de crop com razão fixa 16:5** e ajuste de foco
- **Reposicionamento/zoom durante o crop**
- **Botões**: Salvar, Cancelar, Remover capa
- **Validações visuais** de tamanho e formato
- **Mensagens de sucesso/erro** e loading indicators

#### Especificações Técnicas:

- **Formatos aceitos**: JPEG, PNG, WebP
- **Tamanho máximo**: 5 MB
- **Dimensão mínima**: 2000×700 px (16:5)
- **Compressão automática** no upload

### 2. Seção "Foto de Perfil (Avatar)" (empresa, nutricionista e paciente)

#### Características:

- **Preview do avatar atual** em máscara circular
- **Upload via drag & drop + botão selecionar**
- **Editor de crop com razão 1:1** (quadrado) e pré-visualização em círculo
- **Reposicionamento/zoom durante o crop**
- **Botões**: Salvar, Cancelar, Remover foto
- **Validações visuais** (dimensão mínima, formato)
- **Mensagens de sucesso/erro** e loading indicators

#### Especificações Técnicas:

- **Formatos aceitos**: JPEG, PNG, WebP
- **Tamanho máximo**: 5 MB
- **Dimensão mínima**: 600×600 px (1:1)
- **Compressão automática** no upload

## Arquivos Implementados

### 1. Componente Principal de Crop

**Arquivo**: `components/ui/image-crop-upload.tsx`

Componente React que integra:

- Upload de arquivos com validação
- Interface de crop usando `react-image-crop`
- Controles de escala e rotação
- Preview em tempo real
- Integração com sistema de upload existente

### 2. Utilitário de Variantes de Imagem

**Arquivo**: `lib/image-variants.ts`

Funções para:

- Gerar URLs otimizadas com diferentes tamanhos
- Selecionar melhor variante baseada na viewport/densidade
- Gerar srcSet e sizes para imagens responsivas
- Cache busting com versionamento

### 3. Modal de Perfil Atualizado

**Arquivo**: `components/user-profile-modal.tsx`

Integração do novo componente de crop:

- Substituição dos componentes `ImageUpload` antigos
- Configuração específica para avatar e capa
- Manutenção da compatibilidade com sistema existente

### 4. Página Pública Otimizada

**Arquivo**: `app/nutricionistas/[id]/NutritionistProfileClient.tsx`

Exibição otimizada:

- Capa full-width com overlay para contraste
- Avatar redondo sobreposto com borda sutil
- Imagens responsivas com variantes automáticas
- Acessibilidade com alt text apropriado

## Variantes Geradas

### Capa:

- **cover-lg**: 2000×625px (desktop)
- **cover-md**: 1400×437px (tablet)
- **cover-sm**: 800×250px (mobile)

### Avatar:

- **avatar-512**: 512×512px (alta densidade)
- **avatar-256**: 256×256px (densidade normal)
- **avatar-96**: 96×96px (thumbnails)

## Responsividade

### Capa:

- **Desktop**: Razão 16:5 completa
- **Mobile**: Recorte central otimizado
- **Seleção automática** da melhor variante

### Avatar:

- **Densidade de pixel** detectada automaticamente
- **Tamanhos adaptativos**: 128px (mobile) / 160px (desktop)
- **Variante otimizada** selecionada dinamicamente

## Acessibilidade

### Textos Alternativos:

- **Capa**: `"Capa do perfil de {Nome}"`
- **Avatar**: `"Foto de perfil de {Nome}"`

### Contraste:

- **Overlay gradiente** na capa para legibilidade
- **Bordas sutis** no avatar para separação visual
- **Drop shadows** para melhor definição

## Cache e Performance

### Versionamento:

- **Query parameter** `?v={timestamp}` para cache busting
- **Atualização automática** quando imagem é alterada

### Otimização:

- **Compressão WebP** quando possível
- **Lazy loading** para imagens não críticas
- **Priority loading** para capa (above the fold)

## Como Usar

### 1. Para Desenvolvedores

#### Importar o componente:

```tsx
import { ImageCropUpload } from '@/components/ui/image-crop-upload'
```

#### Usar para avatar:

```tsx
<ImageCropUpload
  onImageUploaded={handleImageUploaded}
  onImageRemoved={handleImageRemoved}
  currentImageUrl={currentUrl}
  userId={userId}
  aspectRatio={1}
  cropType="avatar"
  minWidth={600}
  minHeight={600}
  title="Upload de Avatar"
  description="Selecione uma foto para seu perfil"
/>
```

#### Usar para capa:

```tsx
<ImageCropUpload
  onImageUploaded={handleCoverUploaded}
  onImageRemoved={handleCoverRemoved}
  currentImageUrl={currentCoverUrl}
  userId={userId}
  aspectRatio={16 / 5}
  cropType="cover"
  minWidth={2000}
  minHeight={700}
  title="Upload de Capa"
  description="Selecione uma imagem para a capa"
/>
```

### 2. Para Usuários

#### Upload de Imagem:

1. Clique em "Selecionar arquivo" ou arraste uma imagem
2. Ajuste o enquadramento usando os controles de crop
3. Use os sliders para escala e rotação se necessário
4. Clique em "Salvar" para confirmar

#### Remoção de Imagem:

1. Clique no botão "Remover" na interface
2. Confirme a ação
3. A imagem volta ao placeholder padrão

## Dependências

### Novas Dependências Adicionadas:

- `react-image-crop`: ^11.0.7 (para funcionalidade de crop)

### Dependências Existentes Utilizadas:

- `@radix-ui/react-*`: Componentes de UI
- `lucide-react`: Ícones
- `next/image`: Otimização de imagens
- `supabase`: Upload e armazenamento

## Estrutura de Arquivos

```
components/
├── ui/
│   ├── image-crop-upload.tsx     # Componente principal de crop
│   ├── advanced-image-upload.tsx # Componente existente (mantido)
│   └── image-upload.tsx          # Componente básico (mantido)
├── user-profile-modal.tsx        # Modal atualizado
lib/
├── image-variants.ts             # Utilitários de variantes
├── image-upload.ts               # Funções de upload (existente)
app/
└── nutricionistas/
    └── [id]/
        └── NutritionistProfileClient.tsx # Página pública otimizada
docs/
└── image-upload-system.md        # Esta documentação
```

## Próximos Passos

### Melhorias Futuras:

1. **CDN Integration**: Implementar CDN para melhor performance
2. **Batch Upload**: Permitir upload múltiplo de imagens
3. **Advanced Filters**: Adicionar filtros e efeitos
4. **Analytics**: Tracking de uso das funcionalidades
5. **A/B Testing**: Testar diferentes interfaces de crop

### Monitoramento:

1. **Performance**: Tempo de upload e processamento
2. **Errors**: Taxa de erro em uploads
3. **Usage**: Frequência de uso das funcionalidades
4. **User Feedback**: Satisfação com a interface

## Suporte

Para dúvidas ou problemas:

1. Verifique os logs do console do navegador
2. Confirme as dimensões mínimas das imagens
3. Teste com diferentes formatos de arquivo
4. Verifique a conexão de internet para uploads grandes
