# Regras de Domínio - Teleconsultas

**Data da Definição:** 26/02/2026
**Status:** ATIVO

## 1. Fonte Única da Verdade

A tabela `teleconsulta_sessions` é a **ÚNICA** fonte de verdade para agendamentos, status e realização de teleconsultas.

- **Tabela Oficial:** `teleconsulta_sessions`
- **Tabelas Obsoletas/Legado (PROIBIDAS):**
  - `appointments`
  - `consultations`
  - `telemedicine_consultations`
  - `consultation_sessions`

## 2. Fluxo de Agendamento e Pagamento

1. **Pagamento:** O pagamento é processado via Stripe.
2. **Criação da Sessão:**
   - Ao receber o evento `checkout.session.completed` (webhook), o sistema DEVE criar um registro em `teleconsulta_sessions`.
   - O status inicial deve ser `scheduled` (ou `paid` se aplicável).
   - O `payment_intent_id` deve ser armazenado para garantir idempotência.
3. **Vínculo:** Um registro na tabela `payments` deve ser criado e vinculado à `teleconsulta_sessions` via `teleconsulta_session_id`.

## 3. Ações do Nutricionista

- Nutricionistas visualizam e gerenciam APENAS sessões da tabela `teleconsulta_sessions`.
- Verificação de disponibilidade deve consultar APENAS `teleconsulta_sessions` para identificar conflitos.
- Bloqueio de horário deve considerar status: `scheduled`, `in_progress`, `completed`, `paid`.

## 4. Dashboard e Estatísticas

- Todos os contadores (consultas agendadas, concluídas) devem ser derivados de `teleconsulta_sessions`.
- O histórico de consultas deve vir de `teleconsulta_sessions`.

## 5. Prevenção de Regressão

- É estritamente **PROIBIDO** introduzir novas queries para as tabelas legadas.
- Qualquer funcionalidade nova relacionada a consultas deve usar `teleconsulta_sessions`.
