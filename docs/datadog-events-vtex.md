# Cobertura de Eventos Datadog — VTEX

> Projeto: `eitri-shopping-vtex-shared`
> Módulo de envio: `src/services/Datadog.js`
> Endpoint: `POST https://api.eitri.tech/analytics/event`

## Funções Disponíveis

| Função | Origin (tipo do evento) | Nível |
|--------|------------------------|-------|
| `sendLogError` | `APP-SHOPPING-ERROR` | Erro |
| `sendDatadogWarningLog` | `APP-SHOPPING-WARNING` | Aviso |
| `sendDatadogInfoLog` | `APP-SHOPPING-INFO` | Informativo |
| `sendLogOrderAccepted` | `APP-SHOPPING-ORDER-ACCEPTED` | Informativo |
| `sendOrderNotComplete` | `APP-SHOPPING-ORDER-NOT-COMPLETED` | Erro |

## Payload Comum

Todos os eventos incluem:

- `application` — identificador da aplicação
- `slug` — slug do app Eitri
- `applicationId` — ID da aplicação
- `version` — versão do app
- `deviceId` — ID do dispositivo (via StorageService)
- `sessionId` — ID da sessão (via StorageService)

Dados sensíveis (JWT, cookies de autenticação) são sanitizados antes do envio.

## Eventos por Domínio

### Cart (`cart/VtexCartService.js`) — 10 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `assertMarketingData` | `marketingData`, cart | Falha ao atualizar marketing data no carrinho |
| ERROR | `getCartById` | `orderFormId`, `hasCachedCart` | Falha ao obter carrinho por ID |
| ERROR | `generateNewCart` | — | Falha ao gerar novo carrinho |
| ERROR | `addItem` | payload completo | Falha ao adicionar item único ao carrinho |
| ERROR | `addItems` | payload completo | Falha ao adicionar múltiplos itens ao carrinho |
| ERROR | `changeItemQuantity` | `index`, `newQuantity`, `itemCount` | Falha ao alterar quantidade de item |
| ERROR | `addOfferingsItems` | `itemIndex`, `offeringItemId`, `orderFormId` | Falha ao adicionar ofertas |
| ERROR | `removeOfferingsItems` | `itemIndex`, `offeringItemId`, `orderFormId` | Falha ao remover ofertas |
| ERROR | `addGift` | `selectableGiftId`, `selectedGifts`, `orderFormId` | Falha ao adicionar brindes |
| ERROR | `removeGift` | `selectableGiftId`, `orderFormId` | Falha ao remover brindes |

### Checkout (`checkout/vtexCheckoutService.js`) — 13 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `selectPaymentOption` | — | Falha ao selecionar opção de pagamento |
| ERROR | `addShippingAddress` | — | Falha ao adicionar endereço de entrega |
| ERROR | `setLogisticInfo` | `logisticInfo` | Falha ao definir informações logísticas |
| ERROR | `addUserData` | — | Falha ao adicionar dados do usuário |
| ERROR | `startTransaction` | `orderFormId`, `value`, `referenceValue` | Falha ao iniciar transação |
| ERROR | `setPaymentMethod` | `orderFormId`, `transactionId`, `paymentSystemCount` | Falha ao definir meio de pagamento na gateway |
| ERROR | `processPayment` | `orderFormId`, `orderGroup`, `transactionId`, `responseStatus` | Falha ao processar pagamento na gateway |
| ERROR | `pay` | `orderFormId`, cart | Falha genérica no fluxo de pagamento legado |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — cartão de crédito |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — boleto |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — Pix |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — débito |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — outros meios |

### Payment (`checkout/vtexPaymentService.ts`) — 6 logs

Todos os logs da cadeia de pagamento incluem `orderFormId` para correlação.

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ORDER-ACCEPTED | `executePayment` | cart | Pedido aceito via split payment |
| ORDER-NOT-COMPLETED | `executePayment` | `orderFormId`, cart | Pedido não finalizado (erro com resposta do servidor) |
| ERROR | `executePayment` | `orderFormId`, cart | Erro genérico no processamento |
| ERROR | `startTransaction` | `orderFormId`, `value`, `paymentCount`, cart | Falha ao iniciar transação |
| ERROR | `setPaymentMethod` | `orderFormId`, `transactionId`, `orderGroup`, `paymentCount`, cart | Falha ao definir meio de pagamento |
| ERROR | `processPayment` | `orderFormId`, `orderGroup`, `transactionId`, `responseStatus` | Falha ao processar pagamento na gateway |

### Customer (`customer/vtexCustomerService.js`) — 12 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `vtexOAuth` | `oAuthProvider`, `account` | Falha no fluxo OAuth nativo |
| ERROR | `notifyLoginToExposedApis` | `origin` | Erro ao notificar login para APIs expostas |
| ERROR | `notifyLogoutToExposedApis` | — | Erro ao notificar logout para APIs expostas |
| WARNING | `notifyLoginToExposedApis` | `message`, `origin` | customerId não encontrado ao notificar login |
| WARNING | `notifyLoginToExposedApis` | `message`, `origin` | notifyLogin não disponível no módulo session |
| WARNING | `notifyLogoutToExposedApis` | `message` | notifyLogout não disponível no módulo session |
| WARNING | `_processPostSocialLogin` | `message` | authCookieValue ausente no retorno do OAuth |
| WARNING | `saveUtmParams` | `message`, `utmKeys` | Erro ao salvar parâmetros UTM |
| WARNING | `getUtmParams` | `message` | Erro ao obter parâmetros UTM |
| INFO | `executeRefreshToken` | `message`, `email` | Refresh token executado com sucesso |
| INFO | `executeRefreshToken` | `message`, `responseHeaders` | Erro ao executar refresh token (login) |
| INFO | `executeRefreshToken` | `message`, `email` | Erro ao executar refresh token (geral) |

### Catalog (`catalog/vtexCatalogService.js`) — 15 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `getProductById` | `productId` | Falha ao buscar produto por ID |
| ERROR | `getSkuById` | `skuId` | Falha ao buscar produto por SKU |
| ERROR | `searchProduct` | `text` | Falha na busca inteligente de produtos |
| ERROR | `autoCompleteSuggestions` | `searchTerm` | Falha nas sugestões de autocomplete |
| ERROR | `getProductsByFacets` | `facet` | Falha ao buscar produtos por facetas |
| ERROR | `getPossibleFacets` | `facets` | Falha ao obter facetas disponíveis |
| ERROR | `getSimilarProducts` | `productId` | Falha ao buscar produtos similares |
| ERROR | `legacySearch` | `search` | Falha na busca legada |
| ERROR | `legacyParamsSearch` | — | Falha na busca legada por parâmetros |
| ERROR | `getWhoSawAlsoSaw` | `productId` | Falha ao buscar "quem viu também viu" |
| ERROR | `getCategoryTree` | `categoryLevels` | Falha ao obter árvore de categorias |
| ERROR | `getProductBySlug` | `slug` | Falha ao buscar produto por slug |
| ERROR | `topSearches` | `locale` | Falha ao obter termos mais buscados |
| ERROR | `searchSuggestions` | `query`, `locale` | Falha ao obter sugestões de busca |
| ERROR | `showTogether` | `productId` | Falha ao buscar "compre junto" |

### Session (`session/vtexSessionService.ts`) — 4 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `createSession` | — | Falha ao criar sessão |
| ERROR | `getSession` | `items` | Falha ao obter sessão |
| ERROR | `updateSession` | — | Falha ao atualizar sessão |
| ERROR | `getSegments` | — | Falha ao obter segmentos |

### Wishlist (`wishlist/vtexWishlistService.js`) — 4 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `listItems` | `from`, `to` | Falha ao listar favoritos |
| ERROR | `removeItem` | `id`, `name` | Falha ao remover favorito |
| ERROR | `addItem` | `productId`, `sku`, `listName` | Falha ao adicionar favorito |
| ERROR | `checkItem` | `productId` | Falha ao verificar se item está na lista |

### Subscription (`subscription/vtexSubscriptionService.ts`) — 13 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `listSubscriptions` | — | Falha ao listar assinaturas |
| ERROR | `getSubscription` | `subscriptionId` | Falha ao obter assinatura |
| ERROR | `createSubscription` | — | Falha ao criar assinatura |
| ERROR | `updateSubscription` | `subscriptionId` | Falha ao atualizar assinatura |
| ERROR | `addSubscriptionItem` | `subscriptionId` | Falha ao adicionar item à assinatura |
| ERROR | `updateSubscriptionItem` | `subscriptionId`, `itemId` | Falha ao atualizar item da assinatura |
| ERROR | `removeSubscriptionItem` | `subscriptionId`, `itemId` | Falha ao remover item da assinatura |
| ERROR | `simulateSubscription` | `subscriptionId` | Falha ao simular assinatura existente |
| ERROR | `simulateNewSubscription` | — | Falha ao simular nova assinatura |
| ERROR | `getConversationMessages` | `subscriptionId` | Falha ao obter mensagens da assinatura |
| ERROR | `listCycles` | `subscriptionId` | Falha ao listar ciclos |
| ERROR | `getCycle` | `cycleId` | Falha ao obter ciclo |
| ERROR | `retryCycle` | `cycleId` | Falha ao retentar ciclo de cobrança |

### CMS (`cms/vtexCmsService.js`) — 3 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `getAllContentTypes` | `projectId` | Falha ao obter tipos de conteúdo |
| ERROR | `getPagesByContentTypes` | `projectId`, `contentTypeId` | Falha ao obter páginas por tipo |
| ERROR | `getCmsPage` | `projectId`, `contentTypeId`, `documentId` | Falha ao obter página do CMS |

### Store (`store/vtexStoreService.ts`) — 1 log

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `getLoginProviders` | `account` | Falha ao obter provedores de login |

### Stock Alert (`stockAlert/vtexStockAlertService.js`) — 1 log

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `subscribeAvailability` | `skuId`, `email` | Falha ao inscrever alerta de disponibilidade |

### Google Pay (`googlePay/vtexGooglePayServices.ts`) — 2 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `loadPaymentData` | `env`, `orderFormId` | Falha ao carregar dados de pagamento Google Pay |
| ERROR | `googlePay.isAvailable` | — | Falha ao verificar disponibilidade do Google Pay |

### App (`App.js`) — 5 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `tryAutoConfigure` | — | Falha ao configurar VTEX na inicialização |
| ERROR | `tryAutoConfigure.appConfig` | — | Falha ao montar configuração do app |
| ERROR | `startClarity` | `clarityId` | Falha ao inicializar Microsoft Clarity |
| ERROR | `persistDeviceAndSession` | — | Falha ao persistir device/session ID |
| ERROR | `clearSale` | `appKey` | Falha ao inicializar ClearSale (antifraude) |

## Resumo

| Nível | Quantidade |
|-------|-----------|
| ERROR | 72 |
| WARNING | 6 |
| INFO | 3 |
| ORDER-ACCEPTED | 6 |
| ORDER-NOT-COMPLETED | 1 |
| **Total** | **88** |

## Correlação de Logs na Cadeia de Pagamento

Todos os logs do fluxo de pagamento incluem `orderFormId` como campo explícito no payload, permitindo filtrar no Datadog por `data.orderFormId` para rastrear toda a sequência de uma tentativa de pagamento.

### VtexPaymentService (payV2)

```
executePayment → startTransaction → setPaymentMethod → processPayment
     ↓                  ↓                  ↓                  ↓
 orderFormId        orderFormId        orderFormId        orderFormId
 (via cart)         (via cart)         (via cart)       (via _CACHED_CART)
```

### vtexCheckoutService (pay legado)

```
pay → startTransaction → setPaymentMethod → processPayment
 ↓          ↓                  ↓                  ↓
orderFormId orderFormId     orderFormId        orderFormId
(via cart)  (direto)      (via _CACHED_CART)  (via _CACHED_CART)
```

## Cobertura por Serviço

| Serviço | Total de Métodos | Com Datadog | Cobertura |
|---------|-----------------|-------------|-----------|
| **Cart** | 27 | 10 | 37% |
| **Checkout** | 23 | 13 | 57% |
| **Payment** | 4 | 4 | 100% |
| **Customer** | 43 | 9 | 21% |
| **Catalog** | 17 | 15 | 88% |
| **Session** | 6 | 4 | 67% |
| **Wishlist** | 4 | 4 | 100% |
| **Subscription** | 15 | 13 | 87% |
| **CMS** | 3 | 3 | 100% |
| **Store** | 1 | 1 | 100% |
| **Stock Alert** | 1 | 1 | 100% |
| **Google Pay** | 2 | 2 | 100% |
| **App** | 6 | 5 | 83% |
| **Search (GraphQL)** | 9 | 0 | 0% |
| **Search (Intelligent)** | 16 | 0 | 0% |
| **VtexCaller** | 7 | 0 | N/A (não instrumentar) |
| **Total** | **184** | **84** | **46%** |

## Pendentes

### Search GraphQL / Intelligent Search — 25 métodos, 0 cobertos

Serviços de busca que delegam erros diretamente ao caller. Impacto operacional menor.

### Infraestrutura — VtexCaller — NÃO INSTRUMENTAR

Decisão: **não instrumentar o VtexCaller**. Motivos:

1. **Duplicação de logs** — serviços que já possuem `sendLogError` gerariam dois eventos para o mesmo erro
2. **Ruído** — o Caller não distingue erros esperados (404 em busca, 304) de erros reais; poluiria o Datadog
3. **Falta de contexto** — o Caller só conhece URL e status HTTP; não sabe qual método de negócio falhou, qual carrinho, qual usuário
4. **Risco de quebra** — adicionar try/catch no Caller exige re-throw; se esquecido, o erro é engolido e o serviço acima nunca recebe a exceção

A instrumentação deve ser feita nos **serviços de domínio**, onde existe contexto de negócio.

## Dados Extras por Tipo de Evento

### ORDER-ACCEPTED

Inclui dados adicionais do pedido:

- `cartId` — ID do orderForm
- `value` — valor total (em reais)
- `platform` — plataforma do dispositivo (iOS/Android)
- `state`, `city` — localização do endereço de entrega
- `items[]` — lista de produtos (id, productId, name, price, imageUrl)
- `payments[]` — meios de pagamento utilizados (paymentSystemName)

### ERROR / ORDER-NOT-COMPLETED

Inclui dados adicionais de diagnóstico:

- `device` — informações completas do dispositivo
- `email` — email do cliente (do carrinho)
- `cartId` — ID do orderForm
- `error` — objeto com message, stack, name e headers sanitizados
