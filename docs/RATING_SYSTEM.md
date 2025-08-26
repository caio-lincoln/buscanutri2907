# Sistema de Avaliação de Consultas

## 📋 Visão Geral

O sistema de avaliação permite que pacientes avaliem suas consultas após a conclusão, fornecendo feedback valioso para nutricionistas e outros pacientes. O sistema inclui:

- **Avaliação por estrelas** (1-5)
- **Comentários opcionais**
- **Notificações automáticas**
- **Estatísticas em tempo real**
- **Integração com perfis de nutricionistas**

## 🏗️ Arquitetura

### Tabelas do Banco de Dados

#### `consultation_ratings`
```sql
CREATE TABLE consultation_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(consultation_id)
);
```

### Políticas de Segurança (RLS)

- **Pacientes** podem criar avaliações apenas de suas próprias consultas completadas
- **Pacientes** podem ver e atualizar suas próprias avaliações
- **Nutricionistas** podem ver avaliações de suas consultas
- **Avaliações** são únicas por consulta

## 🔧 Serviços

### `rating-service.ts`
Serviço principal para gerenciar avaliações:

```typescript
// Criar avaliação
createRating(consultationId, patientId, nutritionistId, rating, comment)

// Buscar avaliação de uma consulta
getRatingByConsultation(consultationId)

// Buscar avaliações de um nutricionista
getNutritionistRatings(nutritionistId, limit, offset)

// Buscar estatísticas de avaliação
getNutritionistRatingStats(nutritionistId)

// Verificar se consulta pode ser avaliada
canRateConsultation(consultationId, patientId)
```

### `rating-notification-service.ts`
Serviço para gerenciar notificações de avaliação:

```typescript
// Criar notificação de lembrete
createRatingReminderNotification(patientId, consultationId, nutritionistId)

// Criar notificação de avaliação recebida
createRatingReceivedNotification(nutritionistId, consultationId, rating, patientName)

// Verificar lembretes pendentes
checkForRatingReminders()
```

### `consultation-service.ts`
Serviço para gerenciar consultas e avaliações:

```typescript
// Buscar consultas completadas para avaliação
getCompletedConsultationsForRating(patientId)

// Buscar estatísticas do paciente
getPatientStats(patientId)
```

## 🎨 Componentes

### `ConsultationsToRate`
Componente que exibe consultas completadas que podem ser avaliadas:

```tsx
<ConsultationsToRate patientId={patientId} />
```

**Funcionalidades:**
- Lista consultas completadas sem avaliação
- Modal de avaliação integrado
- Atualização automática após avaliação
- Estados de loading e vazio

### `NutritionistRatings`
Componente que exibe avaliações de um nutricionista:

```tsx
<NutritionistRatings 
  nutritionistId={nutritionistId}
  showStats={true}
  limit={5}
/>
```

**Funcionalidades:**
- Estatísticas de avaliação (média, total)
- Distribuição de estrelas
- Lista de avaliações com comentários
- Estados de loading e vazio

### `RatingModal`
Modal para criar/editar avaliações:

```tsx
<RatingModal
  open={isOpen}
  onOpenChange={setIsOpen}
  consultationId={consultationId}
  nutritionistName={nutritionistName}
  onSubmit={handleSubmit}
/>
```

**Funcionalidades:**
- Seleção de estrelas (1-5)
- Campo de comentário opcional
- Validação de avaliação obrigatória
- Estados de loading durante envio

## 🔄 Fluxo de Avaliação

### 1. Consulta Concluída
- Consulta é marcada como `completed`
- Sistema verifica se pode ser avaliada

### 2. Lembrete de Avaliação
- Após 1 dia da conclusão, sistema cria notificação
- Paciente recebe lembrete para avaliar

### 3. Avaliação do Paciente
- Paciente acessa dashboard
- Vê consultas para avaliar
- Clica em "Avaliar" e preenche formulário

### 4. Processamento da Avaliação
- Avaliação é salva no banco
- Estatísticas do nutricionista são atualizadas
- Notificação é enviada ao nutricionista

### 5. Atualização de Dados
- Rating médio é recalculado
- Total de avaliações é atualizado
- Distribuição de estrelas é recalculada

## 📊 Estatísticas

### Cálculo de Rating Médio
```sql
SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
FROM consultation_ratings 
WHERE nutritionist_id = ?
```

### Distribuição de Estrelas
```sql
SELECT 
  rating,
  COUNT(*) as count,
  (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()) as percentage
FROM consultation_ratings 
WHERE nutritionist_id = ?
GROUP BY rating
ORDER BY rating DESC
```

## 🔔 Notificações

### Tipos de Notificação

#### `rating_reminder`
- **Destinatário:** Paciente
- **Trigger:** 1 dia após consulta concluída
- **Mensagem:** "Como foi sua consulta com [Nutricionista]? Avalie sua experiência..."

#### `rating_received`
- **Destinatário:** Nutricionista
- **Trigger:** Nova avaliação criada
- **Mensagem:** "Você recebeu uma avaliação [positiva/neutra/negativa] de [Paciente]"

### Estrutura da Notificação
```typescript
{
  user_id: string,
  type: 'rating_reminder' | 'rating_received',
  title: string,
  message: string,
  data: {
    consultation_id: string,
    nutritionist_id?: string,
    rating?: number,
    patient_name?: string
  },
  is_read: boolean
}
```

## 🧪 Testes

### Script de Teste
Execute o script para testar o sistema:

```bash
node scripts/test-rating-system.js
```

**Testes incluídos:**
- Verificação da tabela `consultation_ratings`
- Busca de consultas completadas
- Criação/atualização de avaliações
- Cálculo de estatísticas
- Sistema de notificações

## 🚀 Implementação

### 1. Migração do Banco
```bash
# Aplicar migração de avaliações
npm run db:migrate
```

### 2. Integração no Dashboard
```tsx
// Adicionar na página do paciente
import { ConsultationsToRate } from '@/components/dashboard/consultations-to-rate'

// Na seção overview
{profile && (
  <ConsultationsToRate patientId={profile.user_id} />
)}
```

### 3. Configuração de Notificações
```typescript
// Configurar job para lembretes (opcional)
setInterval(async () => {
  await checkForRatingReminders()
}, 24 * 60 * 60 * 1000) // 24 horas
```

## 📈 Métricas e Analytics

### KPIs Importantes
- **Taxa de resposta:** % de consultas avaliadas
- **Rating médio:** Média geral das avaliações
- **Satisfação:** % de avaliações 4-5 estrelas
- **Engajamento:** Tempo médio para avaliar após consulta

### Relatórios Disponíveis
- Avaliações por período
- Performance por nutricionista
- Tendências de satisfação
- Análise de comentários

## 🔒 Segurança

### Validações
- Apenas consultas `completed` podem ser avaliadas
- Uma avaliação por consulta
- Paciente só pode avaliar suas próprias consultas
- Rating deve estar entre 1-5

### Auditoria
- Todas as avaliações são registradas com timestamp
- Histórico de alterações mantido
- Logs de criação/atualização

## 🐛 Troubleshooting

### Problemas Comuns

#### Avaliação não aparece
- Verificar se consulta está `completed`
- Confirmar se não existe avaliação prévia
- Verificar permissões RLS

#### Estatísticas não atualizam
- Verificar triggers do banco
- Confirmar função `update_nutritionist_rating_on_review`
- Verificar logs de erro

#### Notificações não chegam
- Verificar tabela `realtime_notifications`
- Confirmar configuração de RLS
- Verificar dados de consulta

### Logs Úteis
```sql
-- Verificar avaliações recentes
SELECT * FROM consultation_ratings 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar estatísticas
SELECT * FROM nutritionist_profiles 
WHERE rating IS NOT NULL 
ORDER BY rating DESC;

-- Verificar notificações
SELECT * FROM realtime_notifications 
WHERE type IN ('rating_reminder', 'rating_received')
ORDER BY created_at DESC;
```

## 🔮 Melhorias Futuras

### Funcionalidades Planejadas
- **Avaliação por critérios:** Atendimento, conhecimento, etc.
- **Fotos na avaliação:** Evidências visuais
- **Resposta do nutricionista:** Replicar avaliações
- **Avaliação anônima:** Opção de privacidade
- **Badges de qualidade:** Reconhecimento por avaliações

### Otimizações Técnicas
- **Cache de estatísticas:** Redis para performance
- **Batch processing:** Processamento em lote
- **Analytics avançados:** Machine learning para insights
- **API rate limiting:** Proteção contra spam
