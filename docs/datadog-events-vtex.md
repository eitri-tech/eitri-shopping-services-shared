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

### Checkout (`checkout/vtexCheckoutService.js`) — 10 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `selectPaymentOption` | — | Falha ao selecionar opção de pagamento |
| ERROR | `addShippingAddress` | — | Falha ao adicionar endereço de entrega |
| ERROR | `setLogisticInfo` | `logisticInfo` | Falha ao definir informações logísticas |
| ERROR | `addUserData` | — | Falha ao adicionar dados do usuário |
| ERROR / ORDER-NOT-COMPLETED | `pay` | `orderFormId`, `step`, contexto do passo, cart | Falha no fluxo de pagamento legado (centralizado — sub-métodos enriquecem o erro com `e.step` e `e.stepContext`) |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — cartão de crédito |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — boleto |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — Pix |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — débito |
| ORDER-ACCEPTED | `pay` | cart | Pedido aceito — outros meios |

Nota: `startTransaction`, `setPaymentMethod` e `processPayment` não logam diretamente — enriquecem o erro com `e.step` e `e.stepContext` e relançam para o ponto de entrada (`pay`) logar uma única vez.

### Payment (`checkout/vtexPaymentService.ts`) — 3 logs

Todos os logs da cadeia de pagamento incluem `orderFormId`, `step` e `stepContext` para correlação.

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ORDER-ACCEPTED | `executePayment` | cart | Pedido aceito via split payment |
| ORDER-NOT-COMPLETED | `executePayment` | `orderFormId`, `step`, `stepContext`, cart | Pedido não finalizado (códigos CHK0328, CHK003, CHK0087, ORD062, CHK0223) |
| ERROR | `executePayment` | `orderFormId`, `step`, `stepContext`, cart | Erro genérico no processamento |

Nota: `startTransaction`, `setPaymentMethod` e `processPayment` não logam diretamente — enriquecem o erro com `e.step` e `e.stepContext` e relançam para `executePayment` logar uma única vez. Erros já logados por `executePayment` são marcados com `e._datadogLogged` para evitar duplicação quando chamados via `pay`.

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

### Wishlist (`wishlist/vtexWishlistService.js`) — 0 logs

Logs removidos: os métodos lançam `Error('User not logged')` para visitantes anônimos, que é uma condição esperada de negócio e não deve gerar evento ERROR. A instrumentação foi revertida para evitar ruído.

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

### Search GraphQL (`search/vtexSearchGraphql.ts`) — 8 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `graphql.productSearch` | `query` | Falha na busca de produtos via GraphQL |
| ERROR | `graphql.facets` | — | Falha ao obter facetas via GraphQL |
| ERROR | `graphql.product` | `identifier`, `field` | Falha ao obter produto via GraphQL |
| ERROR | `graphql.searchSuggestions` | — | Falha ao obter sugestões de busca via GraphQL |
| ERROR | `graphql.productRecommendations` | `identifier` | Falha ao obter recomendações de produto |
| ERROR | `graphql.autocomplete` | — | Falha no autocomplete via GraphQL |
| ERROR | `graphql.autocompleteSearchSuggestions` | — | Falha nas sugestões de autocomplete via GraphQL |
| ERROR | `graphql.topSearches` | — | Falha ao obter termos mais buscados via GraphQL |

### Intelligent Search (`intelligentSearch/vtexIntelligentSearchService.ts`) — 9 logs

| Evento | Método | Dados de contexto | Descrição |
|--------|--------|-------------------|-----------|
| ERROR | `intelligentSearch.topSearches` | `locale` | Falha ao obter termos mais buscados |
| ERROR | `intelligentSearch.autocompleteSuggestions` | `query` | Falha nas sugestões de autocomplete |
| ERROR | `intelligentSearch.searchSuggestions` | `query` | Falha nas sugestões de busca |
| ERROR | `intelligentSearch.correctionSearch` | `query` | Falha na correção de busca |
| ERROR | `intelligentSearch.banners` | — | Falha ao obter banners de busca |
| ERROR | `intelligentSearch.productSearch` | `query` | Falha na busca de produtos |
| ERROR | `intelligentSearch.facets` | `query` | Falha ao obter facetas |
| ERROR | `intelligentSearch.getProduct` | `value`, `field` | Falha ao obter produto por identificador |
| ERROR | `intelligentSearch.pickupPointAvailability` | — | Falha ao obter pontos de retirada |

## Resumo

| Nível | Quantidade |
|-------|-----------|
| ERROR | 79 |
| WARNING | 6 |
| INFO | 3 |
| ORDER-ACCEPTED | 6 |
| ORDER-NOT-COMPLETED | 2 |
| **Total** | **96** |

## Correlação de Logs na Cadeia de Pagamento

Logs de pagamento são centralizados nos pontos de entrada (`executePayment` e `pay`). Sub-métodos (`startTransaction`, `setPaymentMethod`, `processPayment`) enriquecem o erro com `e.step` e `e.stepContext` mas não logam — evitando duplicação.

### VtexPaymentService (payV2)

```
executePayment ← único ponto de log (ERROR ou ORDER-NOT-COMPLETED)
     ↓
 startTransaction → enriquece e.step='startTransaction', e.stepContext={orderFormId, value, paymentCount}
 setPaymentMethod → enriquece e.step='setPaymentMethod', e.stepContext={orderFormId, transactionId, orderGroup, paymentCount}
 processPayment   → enriquece e.step='processPayment', e.stepContext={orderFormId, orderGroup, transactionId, responseStatus}
```

### vtexCheckoutService (pay legado)

```
pay ← único ponto de log (ERROR ou ORDER-NOT-COMPLETED)
 ↓   (pula se e._datadogLogged=true, ou seja, se executePayment já logou)
 startTransaction → enriquece e.step, e.stepContext
 setPaymentMethod → enriquece e.step, e.stepContext
 processPayment   → enriquece e.step, e.stepContext
```

## Cobertura por Serviço

| Serviço | Total de Métodos | Com Datadog | Cobertura |
|---------|-----------------|-------------|-----------|
| **Cart** | 27 | 10 | 37% |
| **Checkout** | 23 | 10 | 43% |
| **Payment** | 4 | 3 | 75% |
| **Customer** | 43 | 9 | 21% |
| **Catalog** | 17 | 15 | 88% |
| **Session** | 6 | 4 | 67% |
| **Wishlist** | 4 | 0 | 0% (removido — condição de negócio) |
| **Subscription** | 15 | 13 | 87% |
| **CMS** | 3 | 3 | 100% |
| **Store** | 1 | 1 | 100% |
| **Stock Alert** | 1 | 1 | 100% |
| **Google Pay** | 2 | 2 | 100% |
| **App** | 6 | 5 | 83% |
| **Search (GraphQL)** | 9 | 8 | 89% |
| **Search (Intelligent)** | 16 | 9 | 56% |
| **VtexCaller** | 7 | 0 | N/A (não instrumentar) |
| **Total** | **184** | **92** | **50%** |

## Exclusões

### Métodos não instrumentados (por design)

Métodos utilitários, síncronos, de storage local ou delegadores que não fazem chamadas HTTP próprias:

- **Cart**: `saveCartIdOnStorage` (storage), `getCurrentOrCreateCart` (delega para métodos instrumentados), `getCartIfExists` (delega), `getStoredOrderFormId` (storage), `removeItem` (delega para `changeItemQuantity`), `clearCart` (storage + EventBus), `setOrderFormId` (storage)
- **Checkout**: `extractCookieValues` (síncrono), `payV2` (delega para `VtexPaymentService.executePayment`), `executePayment` (delega), `getGiftCartPaymentMethod` (síncrono), `payBankInvoice` (orquestrador — sub-chamadas já instrumentadas), `payInstantPayment` (orquestrador), `payWithCard` (orquestrador), `payPromissory` (orquestrador), `payStoreCart` (orquestrador), `payExternalProvider` (orquestrador), `payGiftCard` (vazio)
- **Customer**: `getCustomerToken` (storage), `getStorageCustomerToken` (storage), `setCustomerToken` (storage), `isLoggedIn` (storage), `setCustomerData` (storage), `getCustomerData` (storage), `retrieveCustomerData` (storage), `clearCustomerData` (storage), `getStoredRegionData` (storage), `newsletterSubscribe` (vazio), `saveUtmParams` (storage + EventBus, já tem WARNING), `getUtmParams` (storage, já tem WARNING)
- **Catalog**: `getSearchOptions` (síncrono), `filterAvailableProductsOnly` (síncrono)
- **Session**: `getSessionToken` (storage local), `removeSession` (storage local)
- **Subscription**: `getCustomerEmail` (utilitário interno), `compact` (síncrono)
- **Search GraphQL**: `toGraphQLArgs` (síncrono)
- **Intelligent Search**: `_buildQueryString`, `_normalizeFacets`, `_getRegionParams`, `_getUtmParams`, `_getBaseDefaults`, `_getSimulationDefaults`, `_appendQuery` (helpers internos)
- **App**: `setStatusBarColor` (síncrono), `setAppName` (síncrono)

### Métodos com chamadas HTTP pendentes de instrumentação

Métodos que fazem chamadas HTTP mas ainda não possuem `sendLogError`:

- **Cart**: `removeAllItems`, `removeClientData`, `resolvePostalCode`, `getClientProfileByEmail`, `addClientPreferences`, `addMarketingData`, `listPickPoints`, `clearOrderFormMessages`, `addOpenTextFieldToCart`, `simulateCart`, `updateItem`, `addAttachmentToItem`
- **Checkout**: `addPromoCode`, `removeAccount`, `getPixStatus`, `resolveZipCode`
- **Customer**: `_startLogin`, `loginWithEmailAndPassword`, `sendAccessKeyByEmail`, `loginWithEmailAndAccessKey`, `loginWithGoogle`, `loginWithFacebook`, `setPassword`, `listOrders`, `getOrderById`, `cancelOrder`, `logout` (chama APIs via session), `isSessionLoggedIn` (chama session), `getCustomerProfile`, `updateCustomerProfile`, `_processPostLogin` (orquestrador com HTTP), `_processPostSocialLogin` (orquestrador com HTTP), `getAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `setRegion` (chama resolveZipCode + session), `removeRegion` (chama session), `addNewCard`, `getSavedCards`, `deleteSavedCard`, `executeRefreshToken` (já tem INFO, sem ERROR)

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

## Sanitização de Dados Sensíveis

`sanitizeError` (`Datadog.js`) faz `{ ...error }` (cópia rasa de todas as propriedades enumeráveis) e limpa apenas `request.headers` e `response.headers` (JWT e cookies de autenticação).

**Investigação (outubro 2026):** verificou-se no Datadog que o objeto de erro lançado por `Eitri.http` **não** expõe `config.data` (padrão do axios que conteria o body da requisição original). Portanto, dados de cartão (`cardNumber`, `validationCode`, `holderName`) enviados no `setPaymentMethod` **não** aparecem nos logs de erro atuais.

**Risco residual:** a abordagem é blocklist (limpa campos conhecidos) e não allowlist (extrai só campos seguros). Se uma atualização futura do `eitri-bifrost` passar a expor `config` ou outro campo com o body da requisição no objeto de erro, dados sensíveis poderiam ser enviados ao Datadog sem que nenhum código deste projeto mude. Recomenda-se re-verificar após upgrades significativos do bifrost.
