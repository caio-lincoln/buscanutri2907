# Sistema de Posts para Nutricionistas

## Visão Geral

O sistema de posts para nutricionistas é uma funcionalidade completa que permite aos profissionais de nutrição criar, gerenciar e publicar conteúdo educativo e informativo através da plataforma BuscaNutri.

## Funcionalidades Implementadas

### 1. Gerenciamento de Posts (`/dashboard/nutricionistas/posts`)

#### Características Principais:
- **Dashboard de Posts**: Visão geral com estatísticas e lista de posts
- **Filtros e Busca**: Filtrar por categoria, status e buscar por texto
- **Ordenação**: Ordenar por data, visualizações, curtidas, etc.
- **Paginação**: Navegação eficiente através de grandes volumes de posts
- **Estatísticas em Tempo Real**: Total de posts, publicados, visualizações e curtidas

#### Estatísticas Exibidas:
- Total de Posts
- Posts Publicados
- Total de Visualizações
- Total de Curtidas

#### Ações Disponíveis:
- Criar novo post
- Editar post existente
- Visualizar post
- Duplicar post
- Publicar posts agendados
- Compartilhar posts
- Excluir posts

### 2. Criação de Posts (`/dashboard/nutricionistas/posts/novo`)

#### Campos Disponíveis:
- **Título**: Título principal do post
- **Conteúdo**: Texto completo com suporte a Markdown
- **Resumo/Excerpt**: Descrição breve (gerada automaticamente se não preenchida)
- **Categoria**: Classificação do conteúdo
- **Tags**: Palavras-chave para organização
- **Imagem Destacada**: URL da imagem principal
- **Status**: Rascunho, Publicado ou Agendado
- **Data de Agendamento**: Para posts programados
- **Metadados SEO**: Título e descrição otimizados para buscadores

#### Funcionalidades:
- **Preview**: Visualização prévia do post
- **Salvamento Automático**: Como rascunho
- **Validação**: Campos obrigatórios e formatos
- **Tags Populares**: Sugestões baseadas em posts existentes
- **Categorias Dinâmicas**: Criar novas categorias ou usar existentes

### 3. Edição de Posts (`/dashboard/nutricionistas/posts/[id]/editar`)

#### Características:
- **Carregamento de Dados**: Pré-preenchimento com dados existentes
- **Preservação de Metadados**: Mantém informações como visualizações e curtidas
- **Histórico**: Informações de criação e última atualização
- **Flexibilidade**: Alterar status, agendar publicação, etc.

### 4. Visualização de Posts (`/dashboard/nutricionistas/posts/[id]`)

#### Funcionalidades:
- **Visualização Completa**: Layout otimizado para leitura
- **Incremento de Views**: Contabilização automática de visualizações
- **Ações Sociais**: Curtir e compartilhar
- **Metadados**: Informações técnicas e estatísticas
- **Navegação**: Voltar para lista, editar, compartilhar

## Estrutura do Banco de Dados

### Tabela `blog_posts`

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  slug TEXT UNIQUE,
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  featured_image_url TEXT,
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Índices para Performance

- `idx_blog_posts_author_id`: Para consultas por autor
- `idx_blog_posts_status`: Para filtros por status
- `idx_blog_posts_category`: Para filtros por categoria
- `idx_blog_posts_published_at`: Para ordenação por data
- `idx_blog_posts_slug`: Para busca por slug

### Row Level Security (RLS)

- **Visualização**: Todos podem ver posts publicados
- **Criação**: Apenas nutricionistas autenticados
- **Edição**: Apenas o autor do post
- **Exclusão**: Apenas o autor do post

## Serviços e APIs

### BlogPostsService (`lib/blog-posts-service.ts`)

#### Métodos Principais:

1. **createPost(data)**: Criar novo post
2. **updatePost(data)**: Atualizar post existente
3. **deletePost(id)**: Excluir post
4. **getPostById(id)**: Buscar post por ID
5. **getPostBySlug(slug)**: Buscar post por slug
6. **getMyPosts(filters, page, limit, sortBy, sortOrder)**: Listar posts do usuário
7. **getMyPostsStats()**: Estatísticas dos posts do usuário
8. **incrementViews(id)**: Incrementar visualizações
9. **incrementLikes(id)**: Incrementar curtidas
10. **incrementShares(id)**: Incrementar compartilhamentos
11. **getCategories()**: Listar categorias disponíveis
12. **getPopularTags(limit)**: Listar tags populares
13. **publishScheduledPost(id)**: Publicar post agendado
14. **duplicatePost(id)**: Duplicar post existente

## Funcionalidades Automáticas

### 1. Geração de Slug
- Criado automaticamente baseado no título
- Garantia de unicidade
- Formato SEO-friendly

### 2. Cálculo de Tempo de Leitura
- Baseado na contagem de palavras
- Estimativa de 200 palavras por minuto
- Atualização automática

### 3. Metadados SEO Automáticos
- Meta título baseado no título do post
- Meta descrição baseada no excerpt ou conteúdo
- Otimização para mecanismos de busca

### 4. Timestamps Automáticos
- `created_at`: Data de criação
- `updated_at`: Atualizado a cada modificação
- `published_at`: Definido na primeira publicação

## Integração com Dashboard

### Menu de Navegação
- Item "Posts" no menu lateral
- Badge com contagem de rascunhos (se houver)
- Navegação direta para diferentes seções

### Estatísticas Globais
- Integração com `useDashboardStats`
- Contadores em tempo real
- Métricas de engajamento

## Segurança e Validações

### Validações Frontend
- Campos obrigatórios (título, conteúdo)
- Formato de URLs para imagens
- Validação de datas para agendamento
- Limite de caracteres para metadados

### Segurança Backend
- Row Level Security (RLS) no Supabase
- Validação de propriedade dos posts
- Sanitização de dados de entrada
- Prevenção de SQL injection

## Responsividade e UX

### Design Responsivo
- Layout adaptável para mobile, tablet e desktop
- Componentes otimizados para diferentes tamanhos de tela
- Navegação touch-friendly

### Experiência do Usuário
- Loading states para todas as operações
- Feedback visual com toasts
- Confirmações para ações destrutivas
- Preview de imagens e conteúdo

## Tecnologias Utilizadas

- **Frontend**: Next.js 15, React, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Notificações**: Sonner (toast)
- **Ícones**: Lucide React

## Próximas Funcionalidades (Roadmap)

1. **Editor Rich Text**: Implementar editor WYSIWYG
2. **Upload de Imagens**: Sistema de upload direto
3. **Comentários**: Sistema de comentários nos posts
4. **Categorias Avançadas**: Hierarquia de categorias
5. **Analytics**: Métricas detalhadas de engajamento
6. **Compartilhamento Social**: Integração com redes sociais
7. **Newsletter**: Sistema de newsletter automático
8. **Moderação**: Sistema de aprovação de posts
9. **Colaboração**: Posts em colaboração entre nutricionistas
10. **Versionamento**: Histórico de versões dos posts

## Como Usar

### Para Nutricionistas:

1. **Acessar**: Navegue para `/dashboard/nutricionistas/posts`
2. **Criar Post**: Clique em "Novo Post"
3. **Preencher Dados**: Título, conteúdo, categoria, tags
4. **Configurar SEO**: Metadados opcionais
5. **Publicar**: Escolha entre rascunho, publicado ou agendado
6. **Gerenciar**: Use filtros e busca para encontrar posts
7. **Editar**: Clique no post para visualizar ou editar
8. **Acompanhar**: Monitore estatísticas e engajamento

### Para Desenvolvedores:

1. **Migração**: Execute a migração SQL no Supabase
2. **Configuração**: Verifique as políticas RLS
3. **Testes**: Teste todas as funcionalidades
4. **Customização**: Adapte conforme necessidades específicas

## Suporte e Manutenção

- **Logs**: Todos os erros são logados no console
- **Monitoramento**: Métricas de performance disponíveis
- **Backup**: Dados protegidos pelo Supabase
- **Escalabilidade**: Arquitetura preparada para crescimento

---

**Versão**: 1.0.0  
**Data**: Janeiro 2025  
**Autor**: Sistema BuscaNutri  
**Status**: Produção