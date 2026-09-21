# eitri-shopping-vtex-cx-ai-shared

Experiência de atendimento (chat Weni + IA, CX VTEX) para apps Eitri, comum a
todas as marcas. Conexão, sessão, histórico, mídia, voz, carrossel de produtos
e navegação para telas nativas vivem aqui — **nada neste pacote é específico de
loja**. Cor, avatar, canal da Weni e conta VTEX vêm de configuração.

## Integrando uma loja nova

### 1. Declare a dependência

Em `eitri-app.conf.js` de cada app que for exibir o chat (tipicamente `home` e
`account`):

```js
'eitri-app-dependencies': {
    'eitri-shopping-vtex-cx-ai-shared': {
        isEitriAppShared: true,
        version: '1.0.0'
    }
}
```

### 2. Descreva a marca

Crie `src/config/chatConfig.js` no app:

```js
import chatAvatar from '../assets/icons/chat-avatar.png'

const CHAT_CONFIG = {
    channelUuid: '<uuid do canal WWC da marca na Weni>',   // obrigatório
    defaultVtexAccount: '<conta vtex da marca>',           // obrigatório
    avatarUrl: chatAvatar,                                 // asset local ou URL
    mainColor: '#<cor-da-marca>',
    customizeWidget: {
        launcherColor: '#<cor-da-marca>',
        userMessageBubbleColor: '#<cor-da-marca>',
        quickRepliesFontColor: '#<cor-da-marca>',
        quickRepliesBackgroundColor: '#<cor-da-marca>33',
        quickRepliesBorderColor: '#<cor-da-marca>'
    }
}

export default CHAT_CONFIG
```

Só `channelUuid` e `defaultVtexAccount` são obrigatórios — o resto tem default
neutro. Cada chave de `customizeWidget` que ficar vazia cai em `mainColor`.

> **Sem arquivo nenhum:** os mesmos campos podem ser publicados no remoteConfig
> na seção `weniChat` e aí a marca é configurada pelo painel, sem release.
> Precedência: `defaults do pacote < remoteConfig['weniChat'] < prop config`.

### 3. Monte o chat

**Na home — botão flutuante + painel:**

```jsx
// src/components/ChatLauncher/ChatLauncher.jsx
import { ChatLauncher as SharedChatLauncher, parseProductRetailerId } from 'eitri-shopping-vtex-cx-ai-shared'

import { useLocalShoppingCart } from '../../providers/LocalCart'
import { useSnackBar } from '../../providers/SnackBar'
import CHAT_CONFIG from '../../config/chatConfig'
import { getProductBySku } from '../../services/ProductService'

export default function ChatLauncher() {
    const { addItem } = useLocalShoppingCart()
    const { showSnackBar } = useSnackBar()

    const handleAddToCart = async item => {
        const { skuId, sellerId } = parseProductRetailerId(item)
        await addItem({ id: skuId, seller: sellerId || '1', quantity: 1 })
        showSnackBar && showSnackBar('success', 'Produto adicionado ao carrinho')
    }

    return (
        <SharedChatLauncher
            config={CHAT_CONFIG}
            onAddToCart={handleAddToCart}
            resolveProduct={getProductBySku}
        />
    )
}
```

E na view: `<ChatLauncher />` como irmão do conteúdo, dentro do `<Page>`.

**Na conta — tela inteira:**

```jsx
// src/views/Chat.jsx
import { ChatScreen, parseProductRetailerId } from 'eitri-shopping-vtex-cx-ai-shared'

import CHAT_CONFIG from '../config/chatConfig'
import { useLocalShoppingCart } from '../providers/LocalCart'
import { useSnackBar } from '../providers/SnackBar'

export default function Chat(props) {
    const { addItem } = useLocalShoppingCart()
    const { showSnackBar } = useSnackBar()

    const handleAddToCart = async item => {
        const { skuId, sellerId } = parseProductRetailerId(item)
        await addItem({ id: skuId, seller: sellerId || '1', quantity: 1 })
        showSnackBar && showSnackBar('success', 'Produto adicionado ao carrinho')
    }

    return (
        <ChatScreen
            config={CHAT_CONFIG}
            onAddToCart={handleAddToCart}
        />
    )
}
```

`ChatScreen` já traz o `<Page>` e o voltar. Para usar o header do próprio app
em vez do header da lib:

```jsx
<ChatScreen config={CHAT_CONFIG} components={{ Header: MeuHeaderDaLoja }} />
```

O componente recebe `connectionStatus`, `onNewConversation` e `onBack`, e lê o
resto por `useChatUI()`.

### 4. Dois handlers que o app precisa fornecer

Não é preguiça da lib: um Eitri-App **compartilhado** tem a própria instância
de `eitri-shopping-vtex-shared`, e o `tryAutoConfigure()` que o host roda no
start configura a instância *dele*. Lá dentro `Vtex.configs.account` fica
vazio e qualquer chamada morre em `"..." cannot be parsed as a URL`. Por isso:

- **`onAddToCart(item)`** — adiciona ao carrinho usando o provider do app
- **`resolveProduct(skuId)`** — busca o produto no catálogo (opcional; sem ela
  só o `skuId` viaja e a PDP resolve, funciona mas pinta mais devagar)

Também **não remonte os providers** (`CartProvider`, `SnackBar`) em volta do
chat: o Forge já monta tudo de `src/providers/` na raiz do app, e reenvolver
cria um segundo estado isolado — a sacola soma no backend mas o badge da tab
bar não atualiza.

## O que dá pra customizar sem tocar no pacote

| Prop | Para quê |
| --- | --- |
| `config` | qualquer chave do chat config (cores, textos, links, canal) |
| `texts` | sobrescreve textos pontuais da UI |
| `components` | troca qualquer componente: `Header`, `Message`, `MessageText`, `LinkCard`, `QuickReplies`, `ListMessage`, `TypingIndicator`, `Input`, `ProductCarousel`, `ProductItem`, `StatusBanner`, `EmptyState` |
| `slots` | `{ top, aboveMessages, belowMessages, aboveInput }` para conteúdo extra |
| `showHeader` / `showBack` / `onBack` / `topInset` / `backIcon` | moldura |
| `linkRules` / `onNavigate` | classificação e interceptação de links do bot |

Um override pode usar `useChatUI()` para acessar `config`, `texts` e os
handlers compartilhados — ou seja, dá para trocar só o header mantendo todo o
resto, sem duplicar nada.

## Estrutura

```
src/
  export.js                    superfície pública
  components/launcher/         ChatLauncher (FAB + painel + estado) — home
  components/screen/           ChatScreen (tela cheia + voltar) — conta
  components/chat/             WeniChat e todas as peças da UI
  config/                      defaults + resolução em 3 camadas
  hooks/useWeniChat.js         para quem quer montar a própria UI
  services/ChatService.js      fachada sobre o motor
  services/LinkRouter.js       link do bot -> tela nativa
  services/weni/               motor (socket, sessão, histórico, mídia, voz)
```

## Publicando

Bump de `version` em `eitri-app.conf.js` + merge na `main`. O `check_and_push.js`
da raiz do repo publica com `eitri push-version --shared`.

> **Atenção à tag.** O `check_and_push.js` nomeia a tag com o trecho depois do
> último hífen do nome do projeto (`project.replace(/.*-/g, '')`), o que dá
> `shared-<version>` — o MESMO prefixo de `vtex-shared`, `shopify-shared` e
> `wake-shared`. Confira se `shared-<version>` já não existe antes de publicar,
> senão o passo do `git tag` falha.
