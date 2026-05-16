# CLAUDE.md — eitri-shopping-services-shared

## Projeto

Este repositório contém SDKs (shared Eitri apps) para integração de apps Eitri com motores de e-commerce.

**Foco atual:** apenas `eitri-shopping-vtex-shared/` — SDKs de Shopify e Wake estão fora de escopo.

## Skills a invocar

Ao iniciar qualquer trabalho neste projeto:
1. Invocar `eitri-coding:eitri-coding` (sinal: `eitri-app.conf.js` presente)
2. Invocar `eitri-coding:eitri-bifrost` ao trabalhar com APIs nativas (`Eitri.*`)

## Arquitetura Eitri

Uma aplicação Eitri é composta por N módulos `eitri-app` isolados em sandbox. Comunicam-se via:
- `Eitri.storage` com `{ shared: true }` — estado persistido entre módulos
- `Eitri.eventBus` — notificações em tempo real entre módulos

Todos os módulos importam o `eitri-shopping-vtex-shared` SDK, que é o elo de coesão com a VTEX.

## Regras do SDK VTEX

- Todo HTTP usa `Eitri.http.*` (Bifrost) — **nunca** `fetch` nativo
- `VtexCaller` injeta automaticamente: JWT, `vtex_segment`, `vtex_session`
- Operações no `orderForm` devem ser enfileiradas — requests paralelos corrompem dados
- `Eitri.sharedStorage` está **deprecado** — usar `Eitri.storage` com `{ shared: true }`

## Referências VTEX (skills)

Documentos de referência com padrões e constraints das APIs VTEX estão em `.claude/vtex-skills/`:

| Arquivo | Quando usar |
|---|---|
| `headless-headless-intelligent-search.md` | Implementar busca, facetas, autocomplete (`Vtex.catalog`, `Vtex.searchGraphql`) |
| `headless-headless-checkout-proxy.md` | Trabalhar com carrinho e checkout (`Vtex.cart`, `Vtex.checkout`) |
| `payment-payment-async-flow.md` | Fluxo de pagamento assíncrono (`vtexPaymentService`) |
| `payment-payment-provider-protocol.md` | Protocolo de integração com provedores de pagamento |
| `masterdata-masterdata-storage-strategy.md` | Dados de cliente, endereços e perfis via MasterData/GraphQL (`Vtex.customer`) |
