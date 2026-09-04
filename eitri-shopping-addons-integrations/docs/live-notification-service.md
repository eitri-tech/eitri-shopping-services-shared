# LiveNotificationService

Live activity / notificação persistente de status de pedido (Dynamic Island no iOS 16.2+, notificação
de progresso no Android 16 / API 36+). Não depende de VTEX, Wake ou Shopify: tudo que é específico do
app entra por `configure`.

## 1. Adicionar a dependência

Em `eitri-app.conf.js` do app consumidor:

```js
'eitri-app-dependencies': {
    'eitri-shopping-addons-integrations': {
        isEitriAppShared: true,
        version: '1.2.0'
    }
}
```

## 2. Configurar uma vez no boot

`configure` é obrigatório para o app ter identidade e telemetria — sem ele o serviço roda com
`storeName: ''` e sem tracking/log. Chame antes da primeira tela que usa a feature (provider
principal, `src/providers/__main__.tsx`).

```ts
import { LiveNotificationService } from 'eitri-shopping-addons-integrations'
import TrackingService from '../services/TrackingService'
import Datadog from '../services/Datadog'

LiveNotificationService.configure({
    storeName: 'Minha Loja',
    trackers: [
        (event, params) => TrackingService.logGaEvent(event, params),
        (event, params) => TrackingService.logInngageEvent(event, params),
        (event, params) => TrackingService.logAppsFlyerEvent(event, params)
    ],
    logger: {
        error: ({ name, message, method, data }) =>
            Datadog.sendDatadogLogError({ name, message }, method, data),
        info: ({ name, message, method, data }) =>
            Datadog.sendDatadogInfoLog({ name, message, ...data }, method)
    }
})
```

Cada tracker é isolado: um que rejeita não derruba os outros nem segura a UI.

| Campo                    | Default                                    | Para que serve                                              |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------- |
| `storeName`              | `''`                                       | Nome exibido na notificação                                  |
| `presets`                | `DEFAULT_ORDER_STATUS_PRESETS`             | Textos/ícones por status; o remote config vence campo a campo |
| `allowedEmailsConfigKey` | `'appConfigs.liveNotificationAllowedEmails'` | Chave do toggle de rollout                                  |
| `contentConfigKey`       | `'appConfigs.liveNotification'`            | Chave do conteúdo remoto                                     |
| `trackers`               | `[]`                                       | Destinos dos eventos de analytics                            |
| `logger`                 | `null`                                     | Destino dos logs de diagnóstico                              |

## 3. Ligar a feature no remote config

**A feature nasce desligada.** Sem lista de e-mails configurada, `startOrderStatusNotification`
sempre retorna `feature_disabled`.

```json
{
	"appConfigs": {
		"liveNotificationAllowedEmails": "*",
		"liveNotification": {
			"storeName": "Minha Loja",
			"statuses": {
				"confirmed": {
					"displayName": "Pedido confirmado",
					"icon": "checkmark.circle.fill",
					"progress": 0.15,
					"message": "Pagamento aprovado. Já vamos separar seus itens."
				}
			}
		}
	}
}
```

`liveNotificationAllowedEmails` aceita array ou string separada por vírgula, ponto-e-vírgula ou quebra
de linha. `'*'` libera para todos. `liveNotification` é todo opcional — campo ausente cai no default
do `configure`. Ambos são cacheados por sessão; `LiveNotificationService.clearCache()` invalida.

`icon` é um SF Symbol; `progress` vai de `0.0` a `1.0`.

## 4. Iniciar na tela de confirmação do pedido

```ts
const result = await LiveNotificationService.startOrderStatusNotification(
    {
        orderId: order.orderId,
        orderIdDisplayText: order.orderNumber,
        status: 'confirmed'
    },
    {
        userEmail: customer.email,
        origin: 'order_placed',
        diagnostics: { delivery_speed: 'express_2h' }
    }
)

if (result.started) {
    // notificação ativa
}
```

O `userEmail` é o que passa (ou não) pelo toggle. `skipPermissionRequest: true` só consulta a
permissão, sem abrir o prompt nativo — use quando o start acontece sem gesto do usuário.

`result.reason` (`StartResultReason`):

| Reason              | O que aconteceu                                                   |
| ------------------- | ----------------------------------------------------------------- |
| `started`           | Notificação criada                                                 |
| `already_active`    | Já existia uma para esse `orderId`; `activityId` vem preenchido     |
| `unsupported`       | Host ou SO sem suporte                                             |
| `missing_order_id`  | `orderId` vazio                                                    |
| `permission_denied` | Push negado ou bloqueado (`BLOCKED` não reabre prompt)              |
| `feature_disabled`  | Fora do toggle — não gera evento de analytics                       |
| `error`             | Falha do módulo nativo; `errorMessage` preenchido                   |

O método nunca lança e nunca retorna `undefined`.

## 5. Atualizar e encerrar

As transições seguintes normalmente chegam por push do webhook da transportadora. Quando o app
precisar mexer:

```ts
await LiveNotificationService.updateOrderStatusNotification({
    orderId,
    status: { displayName: 'Saiu para entrega', icon: 'shippingbox.fill', progress: 0.7 },
    estimatedTime: '18:40'
})

await LiveNotificationService.endOrderStatusNotification(orderId)
await LiveNotificationService.endAllOrderStatusNotifications()
```

`update` retorna `false` se não houver notificação ativa para o pedido.

## 6. Telemetria

- `trackView({ orderId, origin })` — impressão do bloco de acompanhamento.
- `trackClick({ orderId, origin })` — clique, antes de qualquer prompt.
- O desfecho do start (`live_notification_start`) sai sozinho dentro de `startOrderStatusNotification`.
- `logSkippedOrderStatusNotification({ skipReason, orderId, origin, userEmail, diagnostics })` —
  quando a tela decide **não** chamar o start. Vai só para o `logger`, nunca para o funil; com
  `userEmail` fora do toggle, nada é logado.

Ambos os `track*` leem a permissão sem abrir prompt — medir não pode provocar o prompt nativo.

## 7. Antes de renderizar o botão

```ts
const supported = await LiveNotificationService.isOrderStatusSupported()
const enabled = await LiveNotificationService.isEnabledForEmail(customer.email)
const active = await LiveNotificationService.hasActiveOrderNotification(orderId)
```

Sem `supported && enabled`, não mostre o CTA: o start retornaria `unsupported`/`feature_disabled` e o
usuário veria um botão que não faz nada.
