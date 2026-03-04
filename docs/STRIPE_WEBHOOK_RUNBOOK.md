# Stripe Webhook Runbook (BuscaNutri)

Este guia resolve falhas `400 {"error":"Webhook error"}` no endpoint:

- `https://www.buscanutri.com.br/api/stripe/webhook`

## Sintoma

No Stripe Dashboard, eventos com alta taxa de erro (ex.: `account.updated`) e resposta `400`.

## Causa mais comum

Assinatura do webhook validada com secret errado quando existem multiplos endpoints ativos para a mesma URL.

## Suporte implementado no codigo

Arquivo: `app/api/stripe/webhook/route.ts`

O backend agora aceita multiplos secrets, em ordem:

1. `STRIPE_WEBHOOK_SECRETS` (lista separada por virgula)
2. `STRIPE_WEBHOOK_SECRET`
3. `STRIPE_CONNECT_WEBHOOK_SECRET`
4. `STRIPE_WEBHOOK_SECRET_LIVE`
5. `STRIPE_WEBHOOK_SECRET_TEST`

## Configuracao recomendada (producao)

Opcao A (preferida):

- Defina `STRIPE_WEBHOOK_SECRETS` com todos os `whsec_...` ativos do painel.

Exemplo:

```bash
STRIPE_WEBHOOK_SECRETS="whsec_aaa,whsec_bbb,whsec_ccc"
```

Opcao B:

- Preencha cada variavel separada (`STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`, etc.).

## Checklist no Stripe Dashboard

1. Abrir Developers > Webhooks.
2. Para cada endpoint que aponta para `/api/stripe/webhook`, copiar o `Signing secret`.
3. Garantir que todos os secrets ativos estejam no ambiente de producao.
4. Reenviar um evento com falha (`account.updated`) e confirmar status `2xx`.

## Reducao de risco operacional

Evite ter muitos endpoints diferentes apontando para a mesma URL em producao.

Recomendado:

1. Manter apenas o necessario para `Sua conta`.
2. Manter endpoint dedicado para `Contas conectadas`, se realmente usado.
3. Remover endpoints duplicados sem uso.

## Seguranca

Se algum `whsec_...`, `sk_...` ou token MCP foi exposto, rotacione imediatamente no provedor.
