# Eitri Shopping Integrations Shared

Este projeto contém as funcionalidades compartilhadas de integração do Eitri Shopping, incluindo serviços de Google Analytics (Firebase GA), armazenamento e configurações da aplicação.

## Estrutura do Projeto

### Serviços (`src/services/`)

- **App.js**: Serviço principal de configuração da aplicação
- **Tracking.js**: Serviço de tracking que expõe o GA e GA Internal
- **StorageService.js**: Serviço para gerenciamento de storage local
- **Logger.js**: Serviço de logging com diferentes níveis

### Serviços de Tracking (`src/services/tracking/`)

- **GAService.js**: Serviço base do Google Analytics (Firebase GA)
- **GAInternalService.js**: Serviço interno para eventos de e-commerce do GA
- **ClarityService.js**: Serviço de integração com Microsoft Clarity

### Views de Teste (`src/views/`)

- **Home.jsx**: Tela principal com navegação para as funcionalidades de GA
- **GAMethods.jsx**: Tela para testar métodos básicos do Google Analytics

## Funcionalidades do Google Analytics

### Métodos Básicos (GAService)
- `logScreenView(currentPage, pageClass)`: Log de visualização de tela
- `logEvent(event, data)`: Log de eventos customizados
- `logError(event, error)`: Log de erros
- `sendCampaignDetails(segments)`: Envio de detalhes de campanha UTM

### Métodos de E-commerce (GAInternalService)
- `addItemToCart(items, cart)`: Evento de adicionar ao carrinho
- `removeItemFromCart(items, cart)`: Evento de remover do carrinho
- `viewItem(item)`: Evento de visualização de produto
- `viewItemList(items, listName)`: Evento de visualização de lista de produtos
- `beginCheckout(cart)`: Evento de início do checkout
- `addShippingInfo(cart)`: Evento de adição de informações de entrega
- `addPaymentInfo(cart)`: Evento de adição de informações de pagamento
- `purchase(cart, orderId)`: Evento de compra finalizada

## Configurações

O arquivo `remoteConfigTemplate.js` contém um template das configurações necessárias para o funcionamento do projeto, incluindo:

- Informações do provedor de e-commerce
- Configurações da aplicação (Clarity ID, verbose mode, etc.)
- Preferências da loja
- Configurações da navegação

## Como Usar

1. Importe os serviços necessários:
```javascript
import { App, Tracking, StorageService, Logger } from 'eitri-shopping-integrations-shared';
```

2. Configure a aplicação:
```javascript
await App.tryAutoConfigure();
```

3. Use os serviços de tracking:
```javascript
// Eventos básicos
Tracking.ga.logEvent('button_click', { button_name: 'test' });

// Eventos de e-commerce
Tracking.gaInternal.addItemToCart(item, cart);
```

4. Use o storage:
```javascript
await StorageService.setStorageJSON('key', data);
const data = await StorageService.getStorageJSON('key');
```

## Telas de Teste

O projeto inclui uma tela Home simples para inicialização e uma tela GAMethods para testar todas as funcionalidades de Google Analytics implementadas.
