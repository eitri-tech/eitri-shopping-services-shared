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

### Cart (`cart/VtexCartService.js`)

| Evento | Método | Linha | Contexto |
|--------|--------|-------|----------|
| ERROR | `addItem` | 207 | Falha ao adicionar item único ao carrinho |
| ERROR | `addItems` | 281 | Falha ao adicionar múltiplos itens ao carrinho |

### Checkout (`checkout/vtexCheckoutService.js`)

| Evento | Método | Linha | Contexto |
|--------|--------|-------|----------|
| ERROR | `selectPaymentOption` | 46 | Falha ao selecionar opção de pagamento |
| ERROR | `addShippingAddress` | 75 | Falha ao adicionar endereço de entrega |
| ERROR | `setLogisticInfo` | 97 | Falha ao definir informações logísticas |
| ERROR | `addUserData` | 123 | Falha ao adicionar dados do usuário |
| ERROR | `pay` | 363 | Falha genérica no fluxo de pagamento |
| ORDER-ACCEPTED | `pay` | 315 | Pedido aceito — pagamento com cartão de crédito |
| ORDER-ACCEPTED | `pay` | 327 | Pedido aceito — pagamento com boleto |
| ORDER-ACCEPTED | `pay` | 334 | Pedido aceito — pagamento com Pix |
| ORDER-ACCEPTED | `pay` | 342 | Pedido aceito — pagamento com débito |
| ORDER-ACCEPTED | `pay` | 354 | Pedido aceito — outros meios de pagamento |

### Payment (`checkout/vtexPaymentService.ts`)

| Evento | Método | Linha | Contexto |
|--------|--------|-------|----------|
| ORDER-ACCEPTED | `executePayment` | 101 | Pedido aceito via split payment |
| ORDER-NOT-COMPLETED | `executePayment` | 109 | Pedido não finalizado (erro com resposta do servidor) |
| ERROR | `executePayment` | 111 | Erro genérico no processamento do pagamento |

### Customer (`customer/vtexCustomerService.js`)

| Evento | Método | Linha | Contexto |
|--------|--------|-------|----------|
| WARNING | `notifyLoginToExposedApis` | 262 | customerId não encontrado ao notificar login |
| WARNING | `notifyLoginToExposedApis` | 277 | notifyLogin não disponível no módulo session |
| WARNING | `notifyLogoutToExposedApis` | 319 | notifyLogout não disponível no módulo session |
| WARNING | `_processPostSocialLogin` | 781 | authCookieValue ausente no retorno do OAuth |
| ERROR | `notifyLoginToExposedApis` | 310 | Erro ao notificar login para APIs expostas |
| ERROR | `notifyLogoutToExposedApis` | 328 | Erro ao notificar logout para APIs expostas |
| INFO | `executeRefreshToken` | 714 | Refresh token executado com sucesso |
| INFO | `executeRefreshToken` | 726 | Erro ao executar refresh token (login) |
| INFO | `executeRefreshToken` | 739 | Erro ao executar refresh token (geral) |

## Resumo

| Nível | Quantidade |
|-------|-----------|
| ERROR | 10 |
| WARNING | 4 |
| INFO | 3 |
| ORDER-ACCEPTED | 6 |
| ORDER-NOT-COMPLETED | 1 |
| **Total** | **24** |

## Oportunidades de Melhoria de Cobertura

### Prioridade Alta — Caminho Critico de Conversao

Metodos que fazem chamadas HTTP ou operacoes criticas, possuem try/catch, mas nao enviam logs ao Datadog.

#### Cart (`cart/VtexCartService.js`) — 27 metodos, 2 cobertos

| Metodo | try/catch | Recomendacao |
|--------|-----------|-------------|
| `getCartById` | Sim | ERROR — falha ao obter carrinho impacta toda a experiencia |
| `generateNewCart` | Sim | ERROR — falha ao criar carrinho impede o usuario de comprar |
| `changeItemQuantity` | Sim (parcial) | ERROR — falha ao alterar quantidade e frustacao direta do usuario |
| `addOfferingsItems` | Sim | ERROR — falha ao adicionar ofertas/promocoes |
| `removeOfferingsItems` | Sim | ERROR — falha ao remover ofertas |
| `addGift` | Sim | ERROR — falha ao adicionar brindes |
| `removeGift` | Sim | ERROR — falha ao remover brindes |
| `assertMarketingData` | Sim | WARNING — falha silenciosa pode causar perda de atribuicao de campanha |

#### Checkout (`checkout/vtexCheckoutService.js`) — 23 metodos, 7 cobertos

| Metodo | try/catch | Recomendacao |
|--------|-----------|-------------|
| `startTransaction` | Sim (parcial) | ERROR — inicio da transacao e passo critico do pagamento |
| `setPaymentMethod` | Sim (parcial) | ERROR — definicao do meio de pagamento na gateway |
| `processPayment` | Sim (parcial) | ERROR — processamento do pagamento na gateway callback |

#### Payment (`checkout/vtexPaymentService.ts`) — 4 metodos, 1 coberto (executePayment)

| Metodo | try/catch | Recomendacao |
|--------|-----------|-------------|
| `startTransaction` | Sim | ERROR — inicio da transacao dentro do split payment |
| `setPaymentMethod` | Sim | ERROR — envio dos metodos de pagamento para a VTEX |
| `processPayment` | Sim | ERROR — processamento do pagamento com tratamento de status 428 |

#### Customer (`customer/vtexCustomerService.js`) — 43 metodos, 6 cobertos

| Metodo | try/catch | Recomendacao |
|--------|-----------|-------------|
| `vtexOAuth` | Sim | ERROR — falha no fluxo OAuth nativo impede login |
| `saveUtmParams` | Sim | WARNING — perda de UTM afeta atribuicao de campanha |
| `getUtmParams` | Sim | WARNING — falha ao recuperar UTM pode causar inconsistencia |
| `_processPostSocialLogin` | Sim | ERROR — ja tem WARNING, mas erros nao-OAuth nao sao logados |

### Prioridade Media — Servicos sem Nenhuma Cobertura

Servicos inteiros que nao possuem um unico log Datadog.

#### Catalog (`catalog/vtexCatalogService.js`) — 17 metodos, 0 cobertos

Nenhum metodo possui try/catch. Todos delegam erros ao caller (VtexCaller).

| Metodos Criticos | Recomendacao |
|-----------------|-------------|
| `getProductById` | ERROR — produto nao encontrado pode indicar problema de integracao |
| `searchProduct` | ERROR — falha na busca impacta diretamente a experiencia |
| `getProductsByFacets` | ERROR — falha na listagem de produtos |
| `autoCompleteSuggestions` | WARNING — degradacao da experiencia de busca |

#### Session (`session/vtexSessionService.ts`) — 6 metodos, 0 cobertos

Nenhum metodo possui try/catch. Sessao e transversal — falhas aqui afetam toda a jornada.

| Metodos Criticos | Recomendacao |
|-----------------|-------------|
| `createSession` | ERROR — sem sessao, nada funciona |
| `getSession` | ERROR — falha ao obter sessao pode causar comportamento inesperado |
| `updateSession` | ERROR — falha ao atualizar sessao pode invalidar o checkout |

#### Wishlist (`wishlist/vtexWishlistService.js`) — 4 metodos, 0 cobertos

Nenhum metodo possui try/catch.

| Metodos Criticos | Recomendacao |
|-----------------|-------------|
| `addItem` | ERROR — falha ao favoritar e frustacao do usuario |
| `removeItem` | ERROR — falha ao remover favorito |
| `listItems` | WARNING — falha ao listar favoritos |

#### Subscription (`subscription/vtexSubscriptionService.ts`) — 15 metodos, 0 cobertos

Nenhum metodo possui try/catch.

| Metodos Criticos | Recomendacao |
|-----------------|-------------|
| `createSubscription` | ERROR — falha ao criar assinatura e perda de receita recorrente |
| `updateSubscription` | ERROR — falha ao atualizar assinatura |
| `addItem` / `removeItem` | ERROR — falha ao gerenciar itens da assinatura |
| `retryCycle` | ERROR — falha ao retentar ciclo de cobranca |

### Prioridade Baixa — Servicos Auxiliares

#### CMS (`cms/vtexCmsService.js`) — 3 metodos, 0 cobertos

| Metodo | Recomendacao |
|--------|-------------|
| `getAllContentTypes` | WARNING — falha pode degradar experiencia visual |
| `getPagesByContentTypes` | WARNING — idem |
| `getCmsPage` | WARNING — idem |

#### Store (`store/vtexStoreService.ts`) — 1 metodo, 0 cobertos

| Metodo | Recomendacao |
|--------|-------------|
| `getLoginProviders` | WARNING — falha impede opcoes de login |

#### Stock Alert (`stockAlert/vtexStockAlertService.js`) — 1 metodo, 0 cobertos

| Metodo | Recomendacao |
|--------|-------------|
| `subscribeAvailability` | WARNING — falha silenciosa impede aviso-me quando chegar |

#### Google Pay (`googlePay/vtexGooglePayServices.ts`) — 2 metodos, 0 cobertos

| Metodo | Recomendacao |
|--------|-------------|
| `loadPaymentData` | ERROR — falha impede pagamento com Google Pay |
| `isAvailable` | WARNING — falha pode ocultar opcao de pagamento |

### Infraestrutura — VtexCaller e Helpers

#### VtexCaller (`_helpers/_vtexCaller.js`) — 7 metodos, 0 cobertos — NAO INSTRUMENTAR

Decisao: **nao instrumentar o VtexCaller**. Motivos:

1. **Duplicacao de logs** — servicos que ja possuem `sendLogError` gerariam dois eventos para o mesmo erro
2. **Ruido** — o Caller nao distingue erros esperados (404 em busca, 304) de erros reais; poluiria o Datadog
3. **Falta de contexto** — o Caller so conhece URL e status HTTP; nao sabe qual metodo de negocio falhou, qual carrinho, qual usuario
4. **Risco de quebra** — adicionar try/catch no Caller exige re-throw; se esquecido, o erro e engolido e o servico acima nunca recebe a excecao

A instrumentacao deve ser feita nos **servicos de dominio**, onde existe contexto de negocio.

#### App (`App.js`) — 6 metodos, 0 cobertos

| Metodo | try/catch | Recomendacao |
|--------|-----------|-------------|
| `tryAutoConfigure` | Sim | ERROR — falha na inicializacao do app e critica |
| `persistDeviceAndSession` | Sim | WARNING — falha afeta rastreabilidade |
| `clearSale` | Sim | WARNING — falha no antifraude pode bloquear transacoes |
| `startClarity` | Sim | WARNING — perda de analytics de sessao |

## Resumo da Analise

| Servico | Total de Metodos | Com try/catch | Com Datadog | Cobertura |
|---------|-----------------|---------------|-------------|-----------|
| **Cart** | 27 | 8 | 2 | 7% |
| **Checkout** | 23 | 9 | 7 | 30% |
| **Payment** | 4 | 4 | 1 | 25% |
| **Customer** | 43 | 11 | 6 | 14% |
| **Catalog** | 17 | 0 | 0 | 0% |
| **Session** | 6 | 0 | 0 | 0% |
| **Wishlist** | 4 | 0 | 0 | 0% |
| **Subscription** | 15 | 0 | 0 | 0% |
| **Search (GraphQL)** | 9 | 0 | 0 | 0% |
| **Search (Intelligent)** | 16 | 2 | 0 | 0% |
| **CMS** | 3 | 0 | 0 | 0% |
| **Store** | 1 | 0 | 0 | 0% |
| **Stock Alert** | 1 | 0 | 0 | 0% |
| **Google Pay** | 2 | 0 | 0 | 0% |
| **VtexCaller** | 7 | 1 | 0 | N/A (nao instrumentar) |
| **App** | 6 | 4 | 0 | 0% |
| **Total** | **184** | **39** | **16** | **9%** |

---

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
