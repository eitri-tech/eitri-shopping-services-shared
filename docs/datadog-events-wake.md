# Cobertura de Eventos Datadog — Wake

> Projeto: `eitri-shopping-wake-shared`
> Módulo de envio: `src/services/Datadog.js`
> Endpoint: `POST https://api.eitri.tech/analytics/event`

## Funções Disponíveis

| Função | Origin (tipo do evento) | Nível | Utilizada? |
|--------|------------------------|-------|-----------|
| `sendLogError` | `APP-SHOPPING-ERROR` | Erro | Sim |
| `sendDatadogWarningLog` | `APP-SHOPPING-WARNING` | Aviso | Sim |
| `sendDatadogInfoLog` | `APP-SHOPPING-INFO` | Informativo | Sim |
| `sendLogOrderAccepted` | `APP-SHOPPING-ORDER-ACCEPTED` | Informativo | Sim |
| `sendOrderNotComplete` | `APP-SHOPPING-ORDER-NOT-COMPLETED` | Erro | Sim |

## Inicialização — Device e Session

`WakeService.persistDeviceAndSession()` é chamado em `tryAutoConfigure` e persiste no SharedStorage:

- `device_id` — UUID permanente por dispositivo (gerado uma vez, reutilizado)
- `session_id` — UUID novo a cada inicialização do app

Executa apenas na tab principal (`tabIndex === '0'`). Todos os eventos Datadog lêem esses valores via `getDeviceAndSession()` com cache em memória.

## Payload Comum

Todos os eventos incluem dentro de `data`:

- `application` — identificador da aplicacao
- `slug` — slug do app Eitri
- `applicationId` — ID da aplicacao
- `version` — versao do app
- `deviceId` — ID permanente do dispositivo
- `sessionId` — ID da sessao atual

## Eventos por Domínio

### Cart (`CartService.js`)

| Evento | Método | Contexto |
|--------|--------|----------|
| ERROR | `addItems` | Falha ao adicionar itens ao carrinho |

### Customer (`CustomerService.js`)

| Evento | Método | Contexto |
|--------|--------|----------|
| ERROR | `createCustomer` | Falha ao criar cliente |
| ERROR | `customerUpdate` | Falha ao atualizar dados do cliente |
| ERROR | `getSimpleCustomer` | Falha ao obter dados simplificados do cliente |
| ERROR | `getCustomer` | Falha ao obter dados completos do cliente |
| ERROR | `createAddress` | Falha ao criar endereco |
| ERROR | `updateAddress` | Falha ao atualizar endereco |
| WARNING | `getCustomerToken` | Token rejeitado pela API Wake (TKN100) |
| INFO | `getCustomerToken` | Refresh token executado com sucesso |
| INFO | `getCustomerToken` | Falha ao executar refresh token (catch geral) |

### Checkout (`CheckoutService.js`)

| Evento | Método | Contexto |
|--------|--------|----------|
| ERROR | `checkoutCustomerAssociate` | Falha ao associar cliente ao checkout |
| ERROR | `checkoutAddressAssociate` | Falha ao associar endereco ao checkout |
| ERROR | `shippingQuotes` | Falha ao obter cotacoes de frete |
| ERROR | `shippingQuoteGroups` | Falha ao obter grupos de cotacao de frete |
| ERROR | `checkoutSelectShippingQuote` | Falha ao selecionar cotacao de frete |
| ERROR | `paymentMethods` | Falha ao obter meios de pagamento |
| ERROR | `checkoutSelectPaymentMethod` | Falha ao selecionar meio de pagamento |
| ERROR | `checkoutSelectInstallment` | Falha ao selecionar parcelamento |
| ORDER-NOT-COMPLETED | `checkoutComplete` | Checkout nao finalizado (fluxo 1) |
| ORDER-NOT-COMPLETED | `checkoutMultiPaymentsComplete` | Checkout nao finalizado (fluxo 2) |
| ORDER-ACCEPTED | `checkoutComplete` | Pedido aceito (fluxo 1) |
| ORDER-ACCEPTED | `checkoutMultiPaymentsComplete` | Pedido aceito (fluxo 2) |

## Resumo

| Nível | Quantidade |
|-------|-----------|
| ERROR | 14 |
| WARNING | 1 |
| INFO | 2 |
| ORDER-NOT-COMPLETED | 2 |
| ORDER-ACCEPTED | 2 |
| **Total** | **21** |

## Dados Extras por Tipo de Evento

### ORDER-ACCEPTED

- `cartId` — ID do checkout (checkoutId)
- `value` — valor total
- `platform` — plataforma do dispositivo (iOS/Android)
- `state`, `city` — localizacao do endereco de entrega
- `items[]` — lista de produtos (productVariantId, productId, name, price, imageUrl)
- `payments[]` — meios de pagamento utilizados (paymentSystemName)

### ORDER-NOT-COMPLETED

- `cartId` — ID do checkout
- `email` — email do cliente
- `device` — informacoes do dispositivo
- `error` — objeto sanitizado com message, stack, name (JWTs removidos)

### ERROR

- `device` — informacoes do dispositivo
- `email` — email do cliente
- `cartId` — ID do checkout
- `error` — objeto sanitizado com message, stack, name (JWTs removidos)

### WARNING / INFO

- `method` — metodo que originou o evento
- Campos adicionais livres via `data`

## Sanitizacao

`sendLogError` e `sendOrderNotComplete` aplicam `sanitizeError()` antes de enviar o objeto de erro:
- JWTs substituídos por `[JWT_REDACTED]` nos headers de request
