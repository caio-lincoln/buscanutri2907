# Documentação do Schema do Banco de Dados (PLANS)

Este documento fornece uma visão completa e detalhada da estrutura do banco de dados, incluindo tabelas, colunas, storage, triggers, functions e análise de qualidade (tabelas vazias e duplicatas).

> **Data de Geração:** 03/02/2026
> **Ambiente:** Produção (Supabase PostgreSQL)

---

## 1. Estrutura de Tabelas e Colunas

### Domínio: Usuários e Perfis
| Tabela | Descrição | Principais Colunas | Status |
|---|---|---|---|
| `users` | Tabela central de usuários (sincronizada com Auth) | `id`, `email`, `role`, `created_at` | **Ativa** (203 regs) |
| `nutritionist_profiles` | Perfil detalhado de nutricionistas | `id`, `user_id`, `crn`, `bio`, `specialties` | **Ativa** (118 regs) |
| `patient_profiles` | Perfil de pacientes | `id`, `user_id`, `goals`, `health_conditions` | **Ativa** (89 regs) |
| `company_profiles` | Perfil de empresas | `id`, `user_id`, `cnpj`, `company_name` | **Ativa** (4 regs) |
| `user_roles` | Definição de papéis de usuário | `user_id`, `role` | **Ativa** |

### Domínio: Consultas e Agendamentos
| Tabela | Descrição | Principais Colunas | Status |
|---|---|---|---|
| `appointments` | Agendamentos de consultas | `id`, `patient_id`, `nutritionist_id`, `date`, `status` | **Ativa** (22 regs) |
| `consultations` | Registros de consultas realizadas | `id`, `appointment_id`, `notes`, `prescription` | **Ativa** (22 regs) |
| `nutritionist_availability` | Disponibilidade de agenda | `nutritionist_id`, `day_of_week`, `start_time`, `end_time` | **Ativa** (356 regs) |
| `telemedicine_consultations` | Dados específicos de telemedicina | `consultation_id`, `room_url`, `recording_url` | **Ativa** (8 regs) |

### Domínio: Conteúdo e Blog
| Tabela | Descrição | Principais Colunas | Status |
|---|---|---|---|
| `blog_posts` | Artigos do blog | `id`, `title`, `content`, `author_id`, `slug` | **Ativa** (28 regs) |
| `blog_categories` | Categorias de posts | `id`, `name`, `slug` | **Ativa** (5 regs) |
| `blog_post_views` | Contagem de visualizações | `post_id`, `user_id`, `ip_address` | **Ativa** (249 regs) |
| `forum_questions` | Perguntas do fórum | `id`, `title`, `body`, `author_id` | **Ativa** (10 regs) |
| `forum_answers` | Respostas do fórum | `id`, `question_id`, `body`, `author_id` | **Ativa** (15 regs) |

### Domínio: Comunicação
| Tabela | Descrição | Principais Colunas | Status |
|---|---|---|---|
| `chat_conversations` | Conversas de chat | `id`, `participants`, `last_message_at` | **Ativa** (12 regs) |
| `chat_messages` | Mensagens de chat | `conversation_id`, `sender_id`, `content` | **Ativa** (29 regs) |
| `notifications` | Notificações do sistema | `user_id`, `type`, `content`, `read_at` | **Ativa** (4 regs) |

---

## 2. Storage (Armazenamento de Arquivos)

| Bucket ID | Descrição / Uso | Objetos (Arquivos) |
|---|---|---|
| `nutritionist-photos` | Fotos de perfil de nutricionistas | 189 |
| `nutritionist-documents` | Documentos comprobatórios (CRN, Diplomas) | 143 |
| `blog-images` | Imagens usadas em posts do blog | 46 |
| `company-assets` | Logos e arquivos de empresas | 11 |
| `patient-photos` | Fotos de perfil de pacientes | 11 |
| `profile-images` | Imagens genéricas de perfil | 3 |
| `company-certificates` | Certificados de empresas | 3 |
| `documentos-nutricionistas` | Bucket legado/alternativo de documentos | 2 |
| `patient-documents` | Documentos de pacientes | 1 |
| `badges` | Ícones de conquistas/badges | **0 (Vazio)** |

---

## 3. Triggers e Automação

O banco utiliza triggers extensivamente para manter integridade e atualizar campos automáticos.

### Triggers Principais
- **`update_..._updated_at`**: Presente em quase todas as tabelas para atualizar o timestamp `updated_at` automaticamente.
- **`trg_normalize_..._name_biu`**: Normalização de nomes (uppercase/trim) em `nutritionist_profiles`, `patient_profiles`, `company_profiles`.
- **`trigger_update_..._count`**: Manutenção de contadores desnormalizados (ex: `forum_question_answers_count`, `blog_post_likes_count`) para performance.
- **`trigger_create_conversation_on_appointment`**: Cria automaticamente uma conversa de chat quando um agendamento é confirmado.
- **`trg_enforce_patient_limit`**: Impede que pacientes enviem excesso de mensagens sem resposta.

### Functions (Stored Procedures) Principais
- **PostGIS**: Funções geoespaciais (`st_distance`, `st_dwithin`) para busca de nutricionistas por localização.
- **`get_patient_stats`**: Calcula estatísticas agregadas de pacientes para dashboards.
- **`checkauth`**: Validação de segurança/permissões em nível de banco.
- **`create_consultation_booking`**: Lógica complexa de agendamento transacional.
- **`calculate_consultation_price`**: Cálculo dinâmico de preços.

---

## 4. Análise de Qualidade e Limpeza

### ⚠️ Tabelas Vazias (Sem Dados)
As seguintes tabelas possuem 0 registros e são candidatas a revisão ou remoção se não forem parte de features futuras planejadas:

1. `selection_processes`
2. `teleconsulta_recordings`
3. `badges` (Bucket vazio também)
4. `reports`
5. `jobs`
6. `consultation_notes_realtime`
7. `locations`
8. `posts`, `post_likes`, `post_comments` (Parece ser estrutura antiga de blog/social, substituída por `blog_posts` e `forum`)
9. `forum_topics`, `forum_replies` (Substituído por `forum_questions`/`answers`?)
10. `content_flags`
11. `teleconsulta_participants`
12. `course_enrollments`
13. `consultation_records`
14. `moderation_logs`
15. `blog_comment_likes`, `blog_post_shares` (Features de engajamento não utilizadas ainda)
16. `nutritionist_availability_settings` (Configuração avançada não usada)
17. `nutritionist_favorites`
18. `user_badges`
19. `job_postings`, `job_applications` (Módulo de empregos vazio)

### ⚠️ Duplicatas e Redundâncias Identificadas

**Índices Duplicados:**
- Tabela `appointments`:
  - `idx_appointments_appointment_date` E `idx_appointments_date`: Ambos indexam a coluna `appointment_date`. **Ação Recomendada:** Remover um deles.
  - `idx_appointments_nutritionist_date_time` vs `unique_nutritionist_appointment`: O índice unique já cobre a busca, o índice btree adicional pode ser redundante dependendo do padrão de query, mas o unique é mais restritivo.

**Estruturas Redundantes:**
- **Blog vs Posts**: Existem tabelas `blog_posts` (com dados) e `posts` (vazia). Provável migração incompleta ou feature abandonada (`posts`).
- **Fórum**: Existem `forum_questions`/`answers` (com dados) e `forum_topics`/`replies` (vazias).
- **Documentos**: Buckets `nutritionist-documents` (143 arqs) e `documentos-nutricionistas` (2 arqs). Padronizar em um único bucket.

### ⚠️ Extensions
- `postgis`: Habilitada e em uso (tabelas espaciais detectadas).
- `pg_cron`: Habilitada (jobs agendados).
- `pg_graphql`: Habilitada (API GraphQL do Supabase).
- `vector`: Habilitada (busca semântica/IA possivelmente configurada).

---

## 5. Próximos Passos (Plano de Ação)

1. **Limpeza de Schema**:
   - Dropar tabelas legadas (`posts`, `forum_topics`, `forum_replies`) após backup.
   - Analisar necessidade do módulo de Jobs (`jobs`, `job_postings`) se não estiver no roadmap.
2. **Otimização de Índices**:
   - Remover índice duplicado `idx_appointments_date`.
3. **Consolidação de Storage**:
   - Mover arquivos de `documentos-nutricionistas` para `nutritionist-documents` e remover o bucket antigo.
4. **Documentação de Triggers**:
   - Revisar triggers de contadores para garantir que não estão gerando deadlocks em alta concorrência.
