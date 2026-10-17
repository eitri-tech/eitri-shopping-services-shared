# Cobertura de Eventos Datadog — Shopify

> Projeto: `eitri-shopping-shopify-shared`
> Módulo de envio: **inexistente**
> Endpoint: N/A

## Status Atual

O projeto Shopify **não possui nenhuma integração com Datadog**. Não existe um módulo `Datadog.js` e nenhum serviço envia eventos para `https://api.eitri.tech/analytics/event`.

## Comparativo com Outros Providers

| Capacidade | VTEX | Wake | Shopify |
|-----------|------|------|---------|
| `sendLogError` (ERROR) | 10 chamadas | 16 chamadas | — |
| `sendDatadogWarningLog` (WARNING) | 4 chamadas | 0 chamadas | — |
| `sendDatadogInfoLog` (INFO) | 3 chamadas | 0 chamadas | — |
| `sendLogOrderAccepted` (ORDER-ACCEPTED) | 6 chamadas | 2 chamadas | — |
| `sendOrderNotComplete` (ORDER-NOT-COMPLETED) | 1 chamada | — | — |
| Sanitização de dados sensíveis | Sim | Nao | — |
| deviceId / sessionId no payload | Sim | Nao | — |
| **Total de eventos rastreados** | **24** | **18** | **0** |

## Domínios sem Cobertura

Os seguintes serviços do Shopify não possuem rastreamento Datadog:

| Domínio | Serviço | Equivalente VTEX | Equivalente Wake |
|---------|---------|-------------------|------------------|
| Cart | `CartService.ts` | 2 eventos ERROR | 1 evento ERROR |
| Checkout | `CheckoutService.ts` | 10 eventos (ERROR + ORDER-ACCEPTED) | 12 eventos (ERROR + ORDER-ACCEPTED) |
| Customer | `CustomerService.ts` | 5 eventos (ERROR + WARNING + INFO) | 7 eventos ERROR |
| Catalog | `CatalogService.ts` | — | — |
| Search | `SearchService.ts` | — | — |

## Recomendações para Implementação

1. **Criar `src/services/Datadog.ts`** — seguindo o modelo do VTEX (com sanitização e deviceId/sessionId)
2. **Prioridade alta** — instrumentar `CheckoutService` e `CartService` (caminho crítico de conversão)
3. **Prioridade média** — instrumentar `CustomerService` (login, cadastro, refresh token)
4. **Prioridade baixa** — instrumentar `CatalogService` e `SearchService` (menos impacto operacional)
5. **Incluir `sendOrderNotComplete`** — para distinguir erros genéricos de pedidos não finalizados
