# Cobertura de Eventos Datadog — Shopify

> Projeto: `eitri-shopping-shopify-shared`
> Módulo de envio: `src/services/Datadog.ts`
> Endpoint: `https://api.eitri.tech/analytics/event`

## Status Atual

O projeto Shopify possui integração básica com Datadog implementada em `src/services/Datadog.ts`.
Utilitários compartilhados (`JWT_PATTERN`, `sanitizeHeaders`, `sanitizeError`) estão centralizados em `_shared/datadogUtils.js` e reutilizados pelos três providers (VTEX, Wake, Shopify).

## Comparativo com Outros Providers

| Capacidade | VTEX | Wake | Shopify |
|-----------|------|------|---------|
| `sendLogError` (ERROR) | 10 chamadas | 16 chamadas | 15 chamadas |
| `sendDatadogWarningLog` (WARNING) | 4 chamadas | 0 chamadas | 3 chamadas |
| `sendDatadogInfoLog` (INFO) | 3 chamadas | 0 chamadas | 2 chamadas |
| `sendLogOrderAccepted` (ORDER-ACCEPTED) | 6 chamadas | 2 chamadas | consumer app |
| `sendOrderNotComplete` (ORDER-NOT-COMPLETED) | 1 chamada | — | consumer app |
| Sanitização de dados sensíveis | Sim | Não | Sim |
| deviceId / sessionId no payload | Sim | Não | Sim |
| **Total de eventos rastreados** | **24** | **18** | **20** |

## Cobertura por Domínio

| Domínio | Serviço | Eventos Shopify | Equivalente VTEX | Equivalente Wake |
|---------|---------|-----------------|-------------------|------------------|
| Cart | `CartService.ts` | 4 eventos ERROR + 1 WARNING | 2 eventos ERROR | 1 evento ERROR |
| Checkout | consumer app | ORDER-ACCEPTED + ORDER-NOT-COMPLETED | 10 eventos (ERROR + ORDER-ACCEPTED) | 12 eventos (ERROR + ORDER-ACCEPTED) |
| Customer | `CustomerService.ts` + `CustomerAuth.ts` | 5 ERROR + 2 WARNING + 2 INFO | 5 eventos (ERROR + WARNING + INFO) | 7 eventos ERROR |
| Catalog / Search | `CatalogService.ts` | 3 eventos ERROR | — | — |

## Eventos Implementados

### CartService (`src/services/cart/CartService.ts`)

| Método | Função Datadog | Dados extras |
|--------|---------------|--------------|
| `generateNewCart` | `sendLogError` | — |
| `addItemToCart` | `sendLogError` | `cartId`, `merchandiseId` |
| `updateCartLines` | `sendLogError` | `cartId` |
| `removeItemFromCart` | `sendLogError` | `cartId` |

### CustomerService (`src/services/customer/CustomerService.ts`)

| Método | Função Datadog | Observação |
|--------|---------------|------------|
| `getCustomer` | `sendLogError` | Captura erros HTTP e GraphQL via `handleResponse` |
| `updateCustomer` | `sendLogError` | Captura erros HTTP e GraphQL via `handleResponse` |
| `createAddress` | `sendLogError` | — |
| `updateAddress` | `sendLogError` | — |
| `deleteAddress` | `sendLogError` | — |

### AuthService (`src/services/customer/CustomerAuth.ts`)

| Método | Função Datadog | Condição |
|--------|---------------|----------|
| `login` | `sendDatadogInfoLog` | Login concluído com sucesso |
| `login` | `sendLogError` | Exceção no fluxo OAuth |
| `notifyLogin` | `sendDatadogWarningLog` | Customer não encontrado após login |
| `notifyLogin` | `sendDatadogWarningLog` | Formato de customerId inválido |
| `refresh` | `sendDatadogInfoLog` | Refresh token bem-sucedido |
| `refresh` | `sendLogError` | Exceção no refresh |
| `logout` | `sendLogError` | Falha no `endWebSession` |

## Módulo Datadog (`src/services/Datadog.ts`)

Funções disponíveis para uso pelos serviços:

| Função | Origin no evento |
|--------|-----------------|
| `sendLogError` | `APP-SHOPPING-ERROR` |
| `sendDatadogWarningLog` | `APP-SHOPPING-WARNING` |
| `sendDatadogInfoLog` | `APP-SHOPPING-INFO` |
| `sendLogOrderAccepted` | `APP-SHOPPING-ORDER-ACCEPTED` |
| `sendOrderNotComplete` | `APP-SHOPPING-ORDER-NOT-COMPLETED` |

## Eventos de Checkout — Responsabilidade do Consumer App

O Shopify não possui `CheckoutService` no shared. O checkout é externo: o cart expõe um `checkoutUrl` que o consumer app abre via `Eitri.webFlow.start()`. A conclusão (ou falha) do pedido é detectada pelo próprio consumer app via callback de deep link.

Por isso, todas as funções Datadog são exportadas publicamente pelo shared para uso direto pelo consumer app.

### Importação

```ts
import { sendLogOrderAccepted, sendOrderNotComplete, sendLogError } from 'eitri-shopping-shopify-shared'
```

### `sendLogOrderAccepted` — pedido concluído

Disparar quando o webFlow retornar com sucesso e o pedido for confirmado.

```ts
import { sendLogOrderAccepted } from 'eitri-shopping-shopify-shared'

const result = await Eitri.webFlow.start({
    startUrl: cart.checkoutUrl,
    stopPattern: 'thank_you'
})

if (result?.recordedNavigation?.some(nav => nav.url.includes('thank_you'))) {
    await sendLogOrderAccepted({
        cartId: cart.id,
        value: cart.cost.totalAmount.amount,
        email: cart.buyerIdentity?.email,
        items: cart.lines.edges.map(({ node }) => ({
            id: node.id,
            name: node.merchandise.title,
            price: node.cost.totalAmount.amount,
            imageUrl: node.merchandise.image?.url
        }))
    })
}
```

### `sendOrderNotComplete` — checkout iniciado mas não concluído

Disparar quando o webFlow fechar sem chegar à página de confirmação.

```ts
import { sendOrderNotComplete } from 'eitri-shopping-shopify-shared'

const result = await Eitri.webFlow.start({
    startUrl: cart.checkoutUrl,
    stopPattern: 'thank_you|checkout-closed'
})

if (!result?.recordedNavigation?.some(nav => nav.url.includes('thank_you'))) {
    await sendOrderNotComplete(
        new Error('Checkout encerrado sem confirmação'),
        'CheckoutWebFlow',
        { cartId: cart.id }
    )
}
```

### `sendLogError` — erros no fluxo de checkout

Para erros antes de abrir o webFlow (ex: `checkoutUrl` ausente, falha ao buscar o cart).

```ts
import { sendLogError } from 'eitri-shopping-shopify-shared'

try {
    const cart = await Shopify.cart.getCurrentOrCreateCart()
    if (!cart.checkoutUrl) throw new Error('checkoutUrl não disponível')
    await Eitri.webFlow.start({ startUrl: cart.checkoutUrl, stopPattern: 'thank_you' })
} catch (error) {
    await sendLogError(error, 'CheckoutScreen.startCheckout', { cartId: cart?.id })
    throw error
}
```

### CatalogService / Search (`src/services/catalog/CatalogService.ts`)

| Método | Função Datadog | Dados extras |
|--------|---------------|--------------|
| `search` | `sendLogError` | `query` |
| `collection` | `sendLogError` | `handle` |
| `productRecommendations` | `sendLogError` | `productId` |
| `product` | `sendLogError` | `handle`, `id` |

> `predictiveSearch` não foi instrumentado — método ainda não implementado (TODO).

## Pendências

| Domínio | Observação |
|---------|-----------|
| Checkout ORDER-ACCEPTED / ORDER-NOT-COMPLETED | Responsabilidade do consumer app — ver seção acima |
