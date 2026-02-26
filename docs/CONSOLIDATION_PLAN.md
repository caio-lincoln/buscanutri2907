# Plano de Consolidação de Dados

**Objetivo:** Migrar dados remanescentes e remover tabelas legadas com segurança.
**Pré-requisito:** A API deve estar operando 100% sobre `teleconsulta_sessions` (Concluído).

## Fase 1: Monitoramento e Validação (1-2 Semanas)

1. **Monitorar Logs:** Verificar se ainda existem erros ou tentativas de acesso às tabelas legadas (`appointments`, etc.).
2. **Validar Fluxo de Pagamento:** Confirmar que 100% dos novos pagamentos geram registros em `teleconsulta_sessions`.
3. **Verificar Dados Históricos:** Identificar se existem agendamentos futuros válidos perdidos nas tabelas legadas que não foram migrados.

## Fase 2: Migração de Dados (Se necessário)

Caso existam agendamentos futuros em `appointments` que precisam ser preservados:

1. **Script de Migração:**
   Criar script SQL para copiar dados de `appointments` para `teleconsulta_sessions`:
   ```sql
   INSERT INTO teleconsulta_sessions (
     id, nutritionist_id, patient_id, scheduled_at, 
     duration_minutes, price, status, created_at
   )
   SELECT 
     id, nutritionist_id, patient_id, scheduled_at, 
     duration_minutes, price, 
     CASE 
       WHEN status = 'confirmada' THEN 'scheduled'
       WHEN status = 'pendente' THEN 'pending' -- ou tratar
       ELSE status 
     END,
     created_at
   FROM appointments
   WHERE scheduled_at > NOW()
   AND NOT EXISTS (SELECT 1 FROM teleconsulta_sessions WHERE id = appointments.id);
   ```

2. **Sincronização de Pagamentos:**
   Atualizar tabela `payments` para apontar para os novos IDs em `teleconsulta_sessions` onde `teleconsulta_session_id` for NULL.

## Fase 3: Arquivamento e Limpeza

1. **Renomear Tabelas Legadas:**
   - `appointments` -> `appointments_deprecated_2026`
   - `consultations` -> `consultations_deprecated_2026`
   - `telemedicine_consultations` -> `telemedicine_consultations_deprecated_2026`
   - `consultation_sessions` -> `consultation_sessions_deprecated_2026`

2. **Remover Código Morto:**
   - Excluir referências a estas tabelas no código (interfaces, tipos, queries não utilizadas).
   - Remover arquivos de API bloqueados (e.g., `app/api/appointments/create/route.ts`).

3. **Drop Final:**
   - Após 30 dias de operação estável, excluir as tabelas renomeadas.

## Cronograma Sugerido

- **Dia 1-7:** Monitoramento (Fase 1)
- **Dia 8:** Execução de scripts de migração (se houver dados pendentes) (Fase 2)
- **Dia 15:** Renomeação das tabelas (Fase 3 - Início)
- **Dia 45:** Drop final das tabelas (Fase 3 - Fim)
