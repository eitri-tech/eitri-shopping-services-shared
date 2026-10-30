# eitri-shopping-shopify-shared

Integração da Shopify para Eitri-Apps: catálogo e carrinho pela Storefront API,
login e conta do cliente pela Customer Account API. Tudo que é específico da loja
vem do Remote Config; nada aqui é de uma marca.

## Instalação

Em `eitri-app.conf.js` de cada Eitri-App que usa o SDK:

```js
'eitri-app-dependencies': {
	'eitri-shopping-shopify-shared': { isEitriAppShared: true, version: '1.4.1' }
}
```

```ts
import { App, Shopify, CustomerApiError } from 'eitri-shopping-shopify-shared'
```

| Export | O que é |
| --- | --- |
| `App` | `App.configure()`: carrega o Remote Config. Chame antes de qualquer outro método. |
| `Shopify` | `catalog`, `cart`, `customer` (com `customer.auth`), `address` e `http`. |
| `CustomerApiError` | Erro da Customer Account API, com `status`, `code` e `graphqlErrors`. |
| `sendLogError`, `sendDatadogInfoLog`, `sendDatadogWarningLog`, `sendLogOrderAccepted`, `sendOrderNotComplete` | Eventos para o analytics da Eitri (Datadog). |
| Tipos | `Cart`, `Customer`, `CustomerAddress`, `SearchQueryArguments`, `CollectionReturn` e outros de `src/models`. |

## Configuração

### `App.configure`

```ts
await App.configure()
```

Lê o Remote Config do ambiente (`Eitri.environment.getRemoteConfigs`) e guarda em
memória. O argumento opcional é mesclado por cima do Remote Config (merge
profundo), útil para sobrescrever um campo sem mexer no ambiente:

```ts
await App.configure({
	verbose: true,
	providerInfo: { clientId: '<client id>', callbackUrl: '<callback url>' }
})
```

Cada Eitri-App roda numa WebView própria, com a própria instância do SDK. O
`App.configure` precisa rodar em **cada** Eitri-App, com os mesmos overwrites.
Overwrite aplicado só num app não vale para os outros.

### Remote Config

```json
{
	"verbose": false,
	"providerInfo": {
		"host": "https://minha-loja.com.br",
		"storefrontAccessToken": "<token público da Storefront API>",
		"apiVersion": "2026-01",
		"clientId": "<client id da Customer Account API>",
		"callbackUrl": "https://minha-loja.com.br/conta/autorizar",
		"openIdConfigUrl": "https://conta.minha-loja.com.br/.well-known/openid-configuration",
		"customerAccountApiUrl": "https://conta.minha-loja.com.br/customer/api/2026-10/graphql"
	},
	"appConfigs": {
		"statusBarTextColor": "black",
		"clarityId": "<id do projeto no Clarity>"
	}
}
```

| Campo | Obrigatório | Uso |
| --- | --- | --- |
| `providerInfo.host` | sim | Domínio da loja. Base da Storefront API (`<host>/api/<apiVersion>/graphql.json`), do discovery do login e prefixo do id do carrinho no storage. |
| `providerInfo.storefrontAccessToken` | sim | Token público da Storefront API, do app headless da loja (veja abaixo). |
| `providerInfo.apiVersion` | não | Versão da Storefront API. Padrão `2026-01`. |
| `providerInfo.clientId` | para login | Client da Customer Account API. |
| `providerInfo.callbackUrl` | para login | Redirect do login, cadastrado no client. Também é o retorno do logout. |
| `providerInfo.openIdConfigUrl` | não | URL exata do `openid-configuration`. Use quando o domínio da conta não é o `host`. |
| `providerInfo.customerAccountApiUrl` | não | URL exata do GraphQL da Customer Account API. Use quando o domínio da conta não é o `host`. |
| `verbose` | não | `true` liga os logs `[SHARED]` do SDK no console. |
| `appConfigs.statusBarTextColor` | não | `white` ou `black`: cor do texto da status bar, aplicada no `configure`. |
| `appConfigs.clarityId` | não | Inicia o Microsoft Clarity no `configure`. |

### `storefrontAccessToken`: use o do app headless da loja

Crie na Shopify da loja um app pelo canal **Headless**, com o nome do app
(ex.: "App Minha Loja"), e use o token público da Storefront API desse app no
`providerInfo.storefrontAccessToken`.

A Shopify atribui cada pedido ao canal que gerou o carrinho, e esse canal é o
app dono do token. Com um headless próprio, as vendas do app aparecem com o nome
dele nos relatórios e na lista de pedidos, separadas do site. Com o token de
outro canal (o do tema, de outra integração ou de outro app), as vendas do app se
misturam com as dele e não há como separá-las depois.

- Um headless por loja, só para o app. Não reaproveite o token do site.
- O token é público (vai no app), então use o **público**, nunca o privado.
- O mesmo app headless costuma ter o client da Customer Account API
  (`clientId`).

## Catálogo — `Shopify.catalog`

Storefront API. Toda consulta aceita uma query GraphQL própria no último
argumento, para buscar só os campos que a tela usa.

| Método | Retorno |
| --- | --- |
| `search(params, query?)` | `search` da Storefront (padrão `first: 12`). |
| `collection(params, query?)` | `collection` com produtos e filtros (padrão `first: 12`). |
| `product({ handle } \| { id }, query?)` | Produto. |
| `productRecommendations({ intent, productHandle, productId }, query?)` | Lista de produtos recomendados. |

```ts
const result = await Shopify.catalog.search({ query: 'protetor', first: 20 })
const product = await Shopify.catalog.product({ handle: 'protetor-solar-fps-50' })
```

## Carrinho — `Shopify.cart`

O id do carrinho fica no `sharedStorage` (chave `<host>_shopify_cart_key`), então
todos os Eitri-Apps usam o mesmo carrinho.

- Carrinho novo recebe o atributo `origin` (`eitri_android` ou `eitri_ios`). Um
  carrinho carregado sem ele recebe o atributo na hora.
- Com cliente logado, o carrinho novo já nasce com `buyerIdentity` (email,
  telefone, access token e endereço padrão).
- Carrinho que não existe mais na Shopify é recriado no `getCartById`.

| Método | Uso |
| --- | --- |
| `getCurrentOrCreateCart()` | Carrinho atual ou um novo. |
| `getCurrentCartIdOrCreate()` | Só o id. |
| `getCartById(cartId, query?)` | Carrinho por id. |
| `generateNewCart(input?)` | Cria e salva um carrinho novo. |
| `addItemToCart(item)` | Adiciona linhas ao carrinho atual. |
| `updateCartLines(lines)` | Altera quantidade/variante das linhas. |
| `removeItemFromCart(lineIds)` | Remove linhas. |
| `updateDiscountCodes(cartId, codes)` | Cupons. |
| `addGiftCardCode(cartId, codes)` / `removeGiftCardCode(cartId, ids)` | Gift cards. |
| `associateCustomerToCart()` | Liga o cliente logado ao carrinho atual. Chame depois do login. |
| `updateBuyerIdentity(cartId, buyerIdentity)` | Atualiza o comprador. |
| `updateDeliveryAddress(cartId, address)` | Endereço de entrega. |
| `getDeliveryOptionsWithCarrierRates(cartId, onInitialData?, onDeliveryOptions?)` | Opções de frete em stream (`@defer`): o carrinho chega primeiro e o frete calculado depois. |
| `cartAttributesUpdate(attributes)` | Substitui os atributos do carrinho. Mande os atuais junto para não perdê-los. |
| `removeCartFromStorage()` | Esquece o carrinho atual (ex.: depois do pedido). |

```ts
await Shopify.cart.addItemToCart({ lines: [{ merchandiseId: variantId, quantity: 1 }] })
```

## Endereço — `Shopify.address`

`getAddressFromCep(cep)` consulta o ViaCEP e devolve
`{ address1, city, province, country: 'BR', zip }`, ou `null` para CEP inválido
ou não encontrado.

## Conta do cliente — `Shopify.customer`

Customer Account API. Todo método usa o access token do login e faz o refresh
quando ele expira. Sem login, `getCurrentCustomer` devolve `null`; os outros
falham com `CustomerApiError` quando a API responde erro.

| Método | Uso |
| --- | --- |
| `isAuthenticated()` | Existe token válido (faz o refresh se preciso). |
| `getCurrentCustomer()` | Perfil do cliente, ou `null` sem login. |
| `getCustomer()` | Perfil do cliente. |
| `updateCustomer(input)` | Atualiza nome e dados do perfil. |
| `getOrders({ first?, after?, sortKey?, reverse? })` | Pedidos paginados (padrão: 10, mais recentes primeiro). |
| `getOrder(orderId)` | Detalhe do pedido. |
| `createAddress(address, defaultAddress?)` / `updateAddress(id, address, defaultAddress?)` / `deleteAddress(id)` / `setDefaultAddress(id)` | Endereços. |

```ts
try {
	const customer = await Shopify.customer.getCurrentCustomer()
} catch (e) {
	if (e instanceof CustomerApiError && e.code === 'UNAUTHORIZED') {
		// sessão inválida: mande para o login
	}
}
```

A URL da Customer Account API vem, nesta ordem, de
`providerInfo.customerAccountApiUrl`, do cache `SHOPIFY_CUSTOMER_API_URL` ou de
`https://<host>/.well-known/customer-account-api`.

### Login — `Shopify.customer.auth`

OAuth com PKCE, aberto no `Eitri.webFlow`. Precisa de `clientId`, `callbackUrl` e
de uma URL de OpenID (`openIdConfigUrl` ou `host`). Os campos podem vir do Remote
Config ou das opções do `login`.

```ts
const result = await Shopify.customer.auth.login()
if (result.success) {
	await Shopify.cart.associateCustomerToCart()
}
```

| Método | Uso |
| --- | --- |
| `login(options?)` | Abre o login. Resolve `{ success, data, customer }`. Opções: `host`, `clientId`, `callbackUrl`, `openIdConfigUrl`, `allowedDomains`. |
| `getAccessToken()` | Token válido, com refresh automático. `null` sem login ou com refresh falho. |
| `getIdToken()` | ID token do último login. |
| `isAuthenticated()` | Mesmo que `Shopify.customer.isAuthenticated()`. |
| `refresh({ clientId, configUrl })` | Refresh manual. Prefira `getAccessToken()`. |
| `logout()` | Encerra a sessão da Shopify e apaga tokens e caches. |

**URL do OpenID**, nesta ordem:

1. `options.openIdConfigUrl` do `login`
2. `options.host` do `login`
3. `providerInfo.openIdConfigUrl`
4. `providerInfo.host`, montando `https://<host>/.well-known/openid-configuration` (sem `https://` e sem `www.`)

Lojas que já usam só o `host` continuam funcionando sem mudança. Antes de
configurar, confira que a URL responde com `authorization_endpoint` e
`token_endpoint`:

```sh
curl https://conta.minha-loja.com.br/.well-known/openid-configuration
```

**Depois do login**, o SDK:

- grava `clientId`, URL do OpenID e `callbackUrl` usados (`SHOPIFY_LOGIN_CONFIG`).
  O refresh e o logout usam essa configuração, e só caem no Remote Config quando
  ela não existe (login feito antes da 1.4.0);
- avisa o app nativo (`session.notifyLogin`) com o id e o email do cliente, para
  o push.

**Refresh:** `getAccessToken()` renova o token quando faltam menos de 60 s para
expirar. Chamadas simultâneas esperam o mesmo refresh. Se o refresh falhar, o
método devolve `null`; com `verbose: true`, o console mostra
`[SHARED] [AuthService] Falha ao atualizar o token da Shopify`.

**Logout:** além de apagar os tokens, abre o `end_session_endpoint` no
`webFlow`. Sem isso, o cookie da Shopify continua no `webFlow` e o próximo login
entra direto, sem pedir senha. Se essa etapa falhar, o `logout` lança e os tokens
**não** são apagados.

> Placeholder no `clientId` ou no `callbackUrl` do Remote Config faz o login
> funcionar (com overwrite no `login`) mas o refresh falhar, e o cliente cai
> deslogado quando o token expira. Preencha os valores reais no Remote Config, ou
> passe-os no `App.configure` de todos os Eitri-Apps.

### Chaves no `sharedStorage`

O `sharedStorage` é compartilhado entre os Eitri-Apps, que podem estar em
versões diferentes do SDK. Não mude o formato de uma chave existente.

| Chave | Conteúdo |
| --- | --- |
| `SHOPIFY_ACCESS_TOKEN`, `SHOPIFY_REFRESH_TOKEN`, `SHOPIFY_ID_TOKEN` | Tokens da sessão. |
| `SHOPIFY_CODE_VERIFIER` | PKCE do login em andamento. |
| `SHOPIFY_LOGIN_CONFIG` | `clientId`, `configUrl` e `callbackUrl` do último login. |
| `SHOPIFY_OPENID_DISCOVERY` | Cache do `openid-configuration`, com a URL de origem. |
| `SHOPIFY_OPENID_CONFIG` | Cache usado por versões anteriores à 1.4.0. |
| `SHOPIFY_CUSTOMER_API_URL` | Cache da URL da Customer Account API. |
| `<host>_shopify_cart_key` | Id do carrinho atual. |

O `logout` apaga todas, menos o carrinho.

## HTTP — `Shopify.http`

`post(body, options?, url?)` e `get(options?, url?)` chamam a Storefront API com
o header do token público. Use para queries que o SDK não cobre:

```ts
const res = await Shopify.http.post({ query: MINHA_QUERY, variables: { handle } })
```

## Logs e eventos

- `verbose: true` mostra os logs do SDK com prefixo `[SHARED]`.
- Erros de catálogo, carrinho, conta e login vão para
  `https://api.eitri.tech/analytics/event` (exceto no ambiente `dev`, onde só são
  logados). Headers com JWT são mascarados. Cobertura completa em
  [`docs/datadog-events-shopify.md`](../docs/datadog-events-shopify.md).

## Publicação

Suba o `version` em `eitri-app.conf.js`, descreva a mudança em `messageVersion`
e faça merge na `main`: o `check_and_push.js` publica as versões novas (veja o
`CLAUDE.md` da raiz). Os apps passam a usar a versão nova quando atualizam a
dependência.
