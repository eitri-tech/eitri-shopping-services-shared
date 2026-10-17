# Cobertura de Eventos Datadog — Wake

> Projeto: `eitri-shopping-wake-shared`
> Módulo de envio: `src/services/Datadog.js`
> Endpoint: `POST https://api.eitri.tech/analytics/event`

## Funções Disponíveis

| Função | Origin (tipo do evento) | Nível | Utilizada? |
|--------|------------------------|-------|-----------|
| `sendLogError` | `APP-SHOPPING-ERROR` | Erro | Sim |
| `sendDatadogWarningLog` | `APP-SHOPPING-WARNING` | Aviso | Nao |
| `sendDatadogInfoLog` | `APP-SHOPPING-INFO` | Informativo | Nao |
| `sendLogOrderAccepted` | `APP-SHOPPING-ORDER-ACCEPTED` | Informativo | Sim |

> `sendOrderNotComplete` nao existe neste projeto.

## Payload Comum

Todos os eventos incluem:

- `application` — identificador da aplicacao
- `slug` — slug do app Eitri
- `applicationId` — ID da aplicacao
- `version` — versao do app

**Diferenças em relação ao VTEX:**

- Nao inclui `deviceId` / `sessionId`
- Nao sanitiza dados sensíveis (JWT, cookies) — o objeto `error` é espalhado diretamente no payload

## Eventos por Domínio

### Cart (`CartService.js`)

| Evento | Método | Linha | Contexto |
|--------|--------|-------|----------|
| ERROR | `addItems` | 180 | Falha ao adicionar itens ao carrinho |

### Customer (`CustomerService.js`)

| Evento | Método | Linha | Contexto |
|--------|--------|-------|----------|
| ERROR | `createCustomer` | 70 | Falha ao criar cliente |
| ERROR | `customerUpdate` | 128 | Falha ao atualizar dados do cliente |
| ERROR | `getSimpleCustomer` | 183 | Falha ao obter dados simplificados do cliente |
| ERROR | `getCustomer` | 211 | Falha ao obter dados completos do cliente |
| ERROR | `refreshCustomerToken` | 249 | Falha ao renovar token do cliente |
| ERROR | `createAddress` | 277 | Falha ao criar endereco |
| ERROR | `updateAddress` | 298 | Falha ao atualizar endereco |

### Checkout (`CheckoutService.js`)

| Evento | Método | Linha | Contexto |
|--------|--------|-------|----------|
| ERROR | `checkoutCustomerAssociate` | 52 | Falha ao associar cliente ao checkout |
| ERROR | `checkoutAddressAssociate` | 78 | Falha ao associar endereco ao checkout |
| ERROR | `shippingQuotes` | 139 | Falha ao obter cotações de frete (fluxo 1) |
| ERROR | `shippingQuotes` | 161 | Falha ao obter cotações de frete (fluxo 2) |
| ERROR | `checkoutSelectShippingQuote` | 188 | Falha ao selecionar cotação de frete |
| ERROR | `paymentMethods` | 210 | Falha ao obter meios de pagamento |
| ERROR | `checkoutSelectPaymentMethod` | 234 | Falha ao selecionar meio de pagamento |
| ERROR | `checkoutComplete` | 267 | Falha ao finalizar pedido (fluxo 1) |
| ERROR | `checkoutComplete` | 299 | Falha ao finalizar pedido (fluxo 2) |
| ERROR | `checkoutSelectInstallment` | 321 | Falha ao selecionar parcelamento |
| ORDER-ACCEPTED | `checkoutComplete` | 260 | Pedido aceito (fluxo 1) |
| ORDER-ACCEPTED | `checkoutComplete` | 292 | Pedido aceito (fluxo 2) |

## Resumo

| Nível | Quantidade |
|-------|-----------|
| ERROR | 16 |
| WARNING | 0 |
| INFO | 0 |
| ORDER-ACCEPTED | 2 |
| **Total** | **18** |

## Dados Extras por Tipo de Evento

### ORDER-ACCEPTED

Inclui dados adicionais do pedido:

- `cartId` — ID do checkout (checkoutId)
- `value` — valor total
- `platform` — plataforma do dispositivo (iOS/Android)
- `state`, `city` — localização do endereço de entrega
- `items[]` — lista de produtos (productVariantId, productId, name, price, imageUrl)
- `payments[]` — meios de pagamento utilizados (paymentSystemName)

### ERROR

Inclui dados adicionais de diagnóstico:

- `device` — informações do dispositivo
- `email` — email do cliente
- `cartId` — ID do checkout
- `error` — objeto com message, stack, name e demais propriedades do erro original

## Lacunas Identificadas

| Lacuna | Impacto |
|--------|---------|
| `sendDatadogWarningLog` nunca é chamada | Sem visibilidade de avisos (ex: sessão, OAuth) |
| `sendDatadogInfoLog` nunca é chamada | Sem logs informativos (ex: refresh token) |
| `sendOrderNotComplete` não existe | Sem distinção entre erro genérico e pedido não finalizado |
| Sem sanitização de dados sensíveis | Risco de vazamento de tokens/cookies nos logs |
| Sem `deviceId` / `sessionId` | Menor rastreabilidade por dispositivo/sessão |
