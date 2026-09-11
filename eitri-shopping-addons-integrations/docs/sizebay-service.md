# SizebayService / SizeBay

Integração com a [Sizebay](https://sizebay.com) — provador virtual (VFR) e tabela de medidas.
Não depende de VTEX, Wake ou Shopify: tudo que é específico da loja entra por `configure`, e a
URL do produto (`permalink`) é montada pelo app consumidor.

## 1. Adicionar a dependência

Em `eitri-app.conf.js` do app consumidor:

```js
'eitri-app-dependencies': {
    'eitri-shopping-addons-integrations': {
        isEitriAppShared: true,
        version: '1.3.0'
    }
}
```

## 2. Configurar uma vez no boot

`tenantId` é obrigatório — sem ele, `getSizeBayUrls` sempre retorna `null`. Chame antes da primeira
tela que usa a feature (provider principal, `src/providers/__main__.tsx`).

```ts
import { SizebayService } from 'eitri-shopping-addons-integrations'

SizebayService.configure({ tenantId: '7897' })
```

| Campo               | Default                    | Para que serve                                                              |
| -------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `tenantId`            | `''`                        | Tenant da loja na Sizebay. Sem isso a feature fica desligada.                 |
| `country`             | `'BR'`                       | Header `x-szb-country`.                                                      |
| `device`              | `'APP'`                      | Header `x-szb-device`. Use `'APP'` para Eitri-App rodando em WebView nativo.  |
| `legacyUrls`          | `false`                      | Ver seção 5 — **use `false`** em integrações novas.                          |
| `sessionStorageKey`   | `'SIZEBAY_SESSION_ID_V4'`    | Chave em `Eitri.storage` onde o `sid` da sessão é cacheado.                   |

## 3. Usar o componente pronto

```tsx
import { SizeBay } from 'eitri-shopping-addons-integrations'

<SizeBay
    permalink={`${storeHost}/${product.linkText}/p`}
    productImage={currentSku?.images?.[0]?.imageUrl}
    sizesInStock={sizesInStock}
/>
```

Renderiza dois botões — "Descubra seu tamanho" (provador virtual) e "Tabela de Medidas" — que
abrem a UI hospedada da Sizebay via `Eitri.openBrowser` (Custom Tab nativa), **nunca em
`Webview`**: a UI da Sizebay depende de `window.open()`/`target="_blank"` (comparação de marca,
redes sociais), que não funciona de dentro de um `Webview`/iframe aninhado — só dentro de uma
Custom Tab de verdade.

Não renderiza nada enquanto as URLs não resolvem, nem quando a Sizebay não encontra produto válido
para o `permalink`. Quando o produto é um acessório, só o botão da tabela de medidas aparece — é
regra da própria Sizebay, não uma limitação do componente.

Props opcionais: `discoverLabel`/`sizeGuideLabel` (textos dos botões, com defaults em pt-BR — passe
os seus se o app usa `eitri-i18n` ou outro idioma), `discoverIcon`/`sizeGuideIcon` (`ReactNode` —
este pacote não força nenhuma lib de ícones) e `className`.

## 4. Ou montar as URLs você mesmo

Útil se o app já tem seu próprio jeito de abrir links externos, ou quer customizar o layout dos
botões além do que `className`/ícones/labels permitem:

```ts
import { SizebayService } from 'eitri-shopping-addons-integrations'
import Eitri from 'eitri-bifrost'

const urls = await SizebayService.getSizeBayUrls({
    permalink: `${storeHost}/${product.linkText}/p`,
    productImage: currentSku?.images?.[0]?.imageUrl,
    sizesInStock: '36,37,38',
    lang: currentLanguage
})

if (urls?.vfrUrl) await Eitri.openBrowser({ url: urls.vfrUrl, inApp: true })
```

`sizesInStock` é uma string separada por vírgula — calcular isso a partir do catálogo (VTEX, Wake,
Shopify...) é responsabilidade do app consumidor; este pacote não conhece o formato de nenhuma
plataforma.

## 5. Experiência atual vs. legada (`legacyUrls`)

**Use `legacyUrls: false` (default) em qualquer integração nova.** A opção `true` existe só para
compatibilidade com o padrão usado pelos apps mais antigos do `shared-services` (`corello`,
`intimissimi`, `levis`, `mf-base`, `niazi`, `oceane` e outros) — nenhum deles usa o host de VFR
dedicado para calçado, nem a tabela de medidas em host próprio, e a sessão é obtida lendo um
`Set-Cookie` não documentado em vez do endpoint oficial de sessão.

| | `legacyUrls: false` (atual) | `legacyUrls: true` (legado) |
| --- | --- | --- |
| Host do VFR | dedicado para calçado (`new-shoe-experience...`), V4 para o resto | sempre V4, para qualquer produto |
| Tabela de medidas | host próprio (`measurements-table...`) | mesmo host V4, `mode=chart` |
| Sessão (`sid`) | `GET /api/me/session-id`, cacheada em `Eitri.storage` | `Set-Cookie` de `/plugin/my-product-id`, sem cache |

A diferença de sessão importa na prática: sem um cookie jar real reenviando o `Set-Cookie` entre
chamadas — que é o caso do `Eitri.http` — o modo legado cria uma sessão nova a cada chamada. O modo
atual evita isso cacheando o `sid` explicitamente.

## 6. Casos especiais da resposta da Sizebay

- **Acessório** (`accessory: true`): só a tabela de medidas se aplica. `getSizeBayUrls` retorna
  `{ chartUrl }` sem `vfrUrl`, e o componente `SizeBay` some com o botão do provador virtual sozinho.
- **`shoe` inconsistente**: o campo `shoe` da resposta de `/plugin/my-product-id` vem `false` mesmo
  para produtos que são calçado (comportamento observado direto na API, não documentado). O serviço
  também confere `clothesType` (ex.: `"SHOE_ACCESSORY"`) antes de decidir o host do VFR.

## 7. `tenantId` errado é a causa mais comum de tela em branco

Se o provador virtual travar em branco depois de preencher a medida do pé, confira primeiro se o
`tenantId` configurado é o tenant real da loja na Sizebay (geralmente um número curto, ex.: `7897`)
e não outro valor colado por engano (um `sid`/hash de sessão tem esse formato e é fácil de
confundir). Um `tenantId` errado faz `config_v4.json`/`theme_v4.css` retornarem 404 e
`/api/me/user/profile` retornar 500 no fim do fluxo — sintomas que não têm relação óbvia com a
causa real.
