# eitri-shopping-vtex-sales-app — Guia de Integração

SDK de vendas assistidas (instore) para VTEX. Toda a API é exposta pelo facade `Sales`, no padrão dos demais SDKs (`Vtex`, `Shopify`, `Wake`):

```ts
import { Sales } from 'eitri-shopping-vtex-sales-app'

Sales.user         // login, sessão, headers GraphQL
Sales.vendor       // dados do vendedor, vendedores da loja
Sales.cart         // carrinho assistido (initSalesCart, addItem, identifyCustomer, ...)
Sales.performance  // indicadores de venda do mês
```

---

## Configuração do `eitri-app.conf.js`

```js
"eitri-app-dependencies": {
  "eitri-shopping-vtex-sales-app": {
    isEitriAppShared: true,
    version: "0.1.0",
  },
  "eitri-shopping-vtex-shared": {
    isEitriAppShared: true,
    version: "1.15.2",
  },
  i18n: { version: "14.1.2" },
},
```

---

## Configuração do SDK

No startup (ou no `onConfigure` do `AppProvider`):

```ts
await Sales.tryAutoConfigure()
```

`Sales.tryAutoConfigure()` configura também o `eitri-shopping-vtex-shared` (delega para `App.tryAutoConfigure`, idempotente) — os fluxos de login, sessão e carrinho dependem do `Vtex` configurado. Se nenhum `configure` for chamado, a primeira chamada de qualquer serviço configura automaticamente (lazy).

---

## Providers

> Este SDK expõe apenas serviços. Os providers de UI (`AppProvider`, `CartProvider`) são implementados no app consumidor (ou no pacote shared de UI do projeto) — use os códigos abaixo como base exata.

### `AppProvider`

```tsx
import { createContext, useContext, useEffect, useState } from "react";
import Eitri from "eitri-bifrost";
import { View, Text } from "eitri-luminus";
import CartProvider from "./LocalCart";
import { Sales } from "eitri-shopping-vtex-sales-app";
import type { Vendor, SalesAuthContext } from "eitri-shopping-vtex-sales-app";

interface AppContextValue {
  vendorData: Vendor | null | undefined;
  salesAuthContext: SalesAuthContext | null | undefined;
  isConfigured: boolean;
  isLogged: boolean | null;
}

const AppContext = createContext<AppContextValue>({
  vendorData: undefined,
  salesAuthContext: undefined,
  isConfigured: false,
  isLogged: null,
});

export function useAppContext() {
  return useContext(AppContext);
}

interface AppProviderProps {
  children: React.ReactNode;
  onConfigure?: () => Promise<void>;
}

function DebugBanner({
  vendorData,
}: {
  vendorData: Vendor | null | undefined;
}) {
  if (!vendorData) return null;
  return (
    <View className="fixed top-0 left-0 w-[140px] h-[140px] overflow-hidden z-[9999999]">
      <View className="absolute top-[28px] left-[-42px] w-[180px] bg-primary py-2 -rotate-45 flex items-center justify-center">
        <Text className="text-white text-[10px] font-bold">Modo Sales APP</Text>
      </View>
    </View>
  );
}

export default function AppProvider({
  children,
  onConfigure,
}: AppProviderProps) {
  const [vendorData, setVendorData] = useState<Vendor | null | undefined>(
    undefined,
  );
  const [salesAuthContext, setSalesAuthContext] = useState<
    SalesAuthContext | null | undefined
  >(undefined);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLogged, setIsLogged] = useState<boolean | null>(null);

  const getVendorData = async () => {
    const { vendorData, salesAuthContext } = await Sales.cart.getVendor();
    if (vendorData) {
      setVendorData(vendorData);
      setSalesAuthContext(salesAuthContext);
      setIsLogged(true);
    } else {
      setVendorData(null);
      setSalesAuthContext(null);
      setIsLogged(false);
    }
  };

  useEffect(() => {
    const configure = onConfigure ?? (() => Sales.tryAutoConfigure());
    configure()
      .then(async () => {
        setIsConfigured(true);
        await getVendorData();
      })
      .catch((error) => console.error("Error during app configuration", error));
  }, []);

  useEffect(() => {
    Eitri.eventBus.subscribe({
      channel: "VENDOR_DATA_LOGGED" as never,
      broadcast: true,
      callback: async () => {
        await getVendorData();
      },
    });
  }, []);

  return (
    <AppContext.Provider
      value={{ vendorData, salesAuthContext, isConfigured, isLogged }}
    >
      <DebugBanner vendorData={vendorData} />
      <CartProvider vendorData={vendorData} salesAuthContext={salesAuthContext}>
        {children}
      </CartProvider>
    </AppContext.Provider>
  );
}
```

Uso:

```tsx
import AppProvider, { useAppContext } from "./providers/AppProvider";
import { useLocalShoppingCart } from "./providers/LocalCart";
import { Sales } from "eitri-shopping-vtex-sales-app";

export default function Root() {
  return (
    <AppProvider onConfigure={() => Sales.tryAutoConfigure()}>
      <SeuApp />
    </AppProvider>
  );
}

// Em qualquer componente filho:
const { vendorData, salesAuthContext, isLogged } = useAppContext();
const { cart, cartIsLoading, addItem, removeItem, isSalesMode } = useLocalShoppingCart();
```

### `CartProvider`

```jsx
import {
  createContext,
  useState,
  useRef,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { Sales } from "eitri-shopping-vtex-sales-app";
import { Vtex } from "eitri-shopping-vtex-shared";
import Eitri from "eitri-bifrost";

export const LocalCartContext = createContext({});

function generateInstanceId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CartProvider({
  children,
  vendorData,
  salesAuthContext,
  isHomeApp = false,
}) {
  const [cart, setCart] = useState(null);
  const [cartIsLoading, setCartIsLoading] = useState(false);
  const [salesOrderFormId, setSalesOrderFormId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const instanceId = useRef(generateInstanceId()).current;
  const orderFormIdRef = useRef(null);
  const isSalesMode = !!vendorData && !!salesAuthContext;

  const executeCartOperation = async (operation, ...args) => {
    setCartIsLoading(true);
    try {
      const newCart = await operation(...args);
      if (newCart) {
        setCart(newCart);
        if (isSalesMode) {
          Eitri.eventBus.publish({
            channel: "SALES_CART_UPDATED",
            data: { cartData: newCart, sourceInstanceId: instanceId },
          });
        }
      }
      return newCart;
    } finally {
      setCartIsLoading(false);
    }
  };

  const _loadCartById = useCallback(async (orderFormId) => {
    await Vtex.cart.saveCartIdOnStorage(orderFormId);
    setSalesOrderFormId(orderFormId);
    const existingCart = await Vtex.cart.getCartById(orderFormId);
    setCart(existingCart);
  }, []);

  const startCart = useCallback(async () => {
    if (!isInitialized) return;
    await Sales.tryAutoConfigure();

    if (!isSalesMode) {
      return executeCartOperation(() => Vtex.cart.getCurrentOrCreateCart());
    }

    // 1. Já existe carrinho salvo → carrega direto (late-loaders)
    const existingId = await Eitri.sharedStorage.getItem("salesOrderFormId");
    if (existingId) {
      await _loadCartById(existingId);
      return;
    }

    // 2. Apps não-home aguardam SALES_CART_INITIALIZED
    if (!isHomeApp) return;

    // 3. Home app: cria o carrinho e notifica todos
    await executeCartOperation(async () => {
      const newCart = await Sales.cart.initSalesCart(
        vendorData,
        salesAuthContext,
      );
      Vtex.cart._CACHED_CART = newCart;
      await Eitri.sharedStorage.setItem(
        "salesOrderFormId",
        newCart.orderFormId,
      );
      Eitri.eventBus.publish({
        channel: "SALES_CART_INITIALIZED",
        data: { orderFormId: newCart.orderFormId, cartData: newCart },
      });
      return newCart;
    });
  }, [
    isInitialized,
    isSalesMode,
    isHomeApp,
    vendorData,
    salesAuthContext,
    _loadCartById,
  ]);

  useEffect(() => {
    if (vendorData !== undefined && salesAuthContext !== undefined)
      setIsInitialized(true);
  }, [vendorData, salesAuthContext]);

  useEffect(() => {
    if (isInitialized) startCart();
  }, [isInitialized, startCart]);

  // Todas as instâncias ouvem SALES_CART_INITIALIZED
  useEffect(() => {
    Eitri.eventBus.subscribe({
      channel: "SALES_CART_INITIALIZED",
      broadcast: true,
      callback: async ({ orderFormId }) => {
        await _loadCartById(orderFormId);
      },
    });
  }, [_loadCartById]);

  // Sincroniza atualizações de carrinho entre instâncias
  useEffect(() => {
    Eitri.eventBus.subscribe({
      channel: "SALES_CART_UPDATED",
      broadcast: true,
      callback: ({ cartData, sourceInstanceId }) => {
        if (sourceInstanceId === instanceId) return;
        setCart(cartData);
      },
    });
  }, [instanceId]);

  // Mantém ref atualizado para evitar stale closure no onResume
  useEffect(() => {
    orderFormIdRef.current = salesOrderFormId ?? cart?.orderFormId ?? null;
  }, [salesOrderFormId, cart]);

  useEffect(() => {
    Eitri.navigation.setOnResumeListener(async () => {
      if (orderFormIdRef.current) await _loadCartById(orderFormIdRef.current);
    });
  }, [_loadCartById]);

  const addItem = async (payload) => {
    if (isSalesMode && salesOrderFormId)
      return executeCartOperation(
        () => Sales.cart.addItem(salesOrderFormId, payload),
      );
    return executeCartOperation(() => Vtex.cart.addItem(payload));
  };

  const removeItem = async (itemIndex) => {
    if (isSalesMode && salesOrderFormId)
      return executeCartOperation(
        () => Sales.cart.removeItem(salesOrderFormId, itemIndex),
      );
    return executeCartOperation(() => Vtex.cart.removeItem(itemIndex));
  };

  const changeQuantity = async (index, newQuantity) =>
    executeCartOperation(() =>
      Vtex.cart.changeItemQuantity(index, newQuantity),
    );

  const addItemOffer = async (itemIndex, offeringId) =>
    executeCartOperation(() =>
      Vtex.cart.addOfferingsItems(itemIndex, offeringId),
    );

  const removeItemOffer = async (itemIndex, offeringId) =>
    executeCartOperation(() =>
      Vtex.cart.removeOfferingsItems(itemIndex, offeringId),
    );

  const addCoupon = async (coupon) =>
    executeCartOperation(() => Vtex.checkout.addPromoCode(coupon));

  const removeCoupon = async () =>
    executeCartOperation(() => Vtex.checkout.addPromoCode(""));

  const setFreight = async (payload) =>
    executeCartOperation(() => Vtex.checkout.setLogisticInfo(payload));

  const reloadCart = useCallback(async () => {
    const orderFormId = orderFormIdRef.current;
    if (!orderFormId) return;
    return executeCartOperation(() => Vtex.cart.getCartById(orderFormId));
  }, []);

  // Recarrega quando solicitado por outro eitri-app
  useEffect(() => {
    Eitri.eventBus.subscribe({
      channel: "SALES_CART_RELOAD",
      broadcast: true,
      callback: () => {
        reloadCart();
      },
    });
  }, [reloadCart]);

  const setNewAddress = async (currentCart, zipCode) =>
    executeCartOperation(async () => {
      const address = await Vtex.checkout.resolveZipCode(zipCode);
      const selectedAddresses = _generateSelectedAddresses(
        currentCart?.shippingData?.selectedAddresses,
        address,
      );
      return Vtex.checkout.setLogisticInfo({
        logisticsInfo: currentCart?.shippingData?.logisticsInfo,
        clearAddressIfPostalCodeNotFound: false,
        selectedAddresses,
      });
    });

  return (
    <LocalCartContext.Provider
      value={{
        setCart,
        startCart,
        cart,
        cartIsLoading,
        addItem,
        removeItem,
        changeQuantity,
        addItemOffer,
        removeItemOffer,
        addCoupon,
        removeCoupon,
        setFreight,
        setNewAddress,
        reloadCart,
        isSalesMode,
        isInitialized,
        salesOrderFormId,
      }}
    >
      {children}
    </LocalCartContext.Provider>
  );
}

export function useLocalShoppingCart() {
  return useContext(LocalCartContext);
}

function _generateSelectedAddresses(selectedAddresses, address) {
  const {
    street,
    neighborhood,
    city,
    state,
    country,
    geoCoordinates,
    postalCode,
  } = address;
  const base = {
    isDisposable: true,
    postalCode,
    city,
    state,
    country,
    street,
    number: null,
    neighborhood,
    complement: null,
    reference: null,
    geoCoordinates: geoCoordinates?.map((c) => c) ?? [],
    addressQuery: "",
  };
  if (selectedAddresses?.length > 0) {
    return selectedAddresses.map((sa) => ({
      ...base,
      addressType: sa.addressType,
      receiverName: sa.receiverName,
      addressId: sa.addressId,
      addressQuery: sa.addressQuery,
    }));
  }
  return [
    { ...base, addressType: "search", receiverName: "" },
    { ...base, addressType: "residential", receiverName: "" },
  ];
}
```

Uso manual (se já tem provider raiz próprio):

```tsx
import CartProvider from "./providers/LocalCart";

<CartProvider vendorData={vendorData} salesAuthContext={salesAuthContext}>
  <SeuApp />
</CartProvider>;
```

---

## Fluxo do carrinho

> **Se precisar implementar um provider de carrinho próprio**, use o `CartProvider` acima como referência. Ele já contém a implementação completa do lock otimista para evitar concorrência entre múltiplas instâncias.

O `CartProvider` detecta o modo via `isSalesMode = !!vendorData && !!salesAuthContext`.

**Modo regular** → usa `Vtex.cart` padrão.

**Modo sales** → na ausência de `salesOrderFormId` no `sharedStorage`, vários apps podem tentar criar o carrinho ao mesmo tempo. O provider usa um **lock otimista com read-back + jitter** para eleger um único líder:

```
App A              App B              App C
   |                  |                  |
   ←── todos leem salesOrderFormId → null ──→
   |                  |                  |
   ←── todos gravam lock com seu próprio ID ──→
   |                  |                  |
   ←────── jitter aleatório 80–160ms ─────→
   |                  |                  |
   ←── todos releem o lock ──→
   |                  |                  |
aguarda evento    LÍDER (ganhou)     aguarda evento
                      |
          Sales.cart.initSalesCart(...)
                      |
           publica SALES_CART_INITIALIZED
                      |
                 remove lock
```

Os apps que aguardam recebem o `orderFormId` via `SALES_CART_INITIALIZED` e atualizam seu estado. Lock TTL: **15 segundos** (proteção contra crash do líder).

Após qualquer operação de cart (`addItem`, `removeItem`, etc.), o `CartProvider` publica `SALES_CART_UPDATED` para sincronizar as demais instâncias sem precisar refazer a requisição.

As operações do hook delegam automaticamente:

```tsx
const { addItem } = useLocalShoppingCart();

// funciona igual nos dois modos
await addItem({ itemId: "9999", quantity: 1 });
```

O `Sales.cart.initSalesCart` executa a cadeia completa: criar orderForm → check-in no pickupPoint → sessão → login sales-app → associar vendedor → endereço da loja → perfil anônimo → marketing data → customData → merchantContextData.

---

## Login do vendedor

> Este SDK não exporta views — a tela de login é implementada no app consumidor (ex.: rota `/SalesSignin`) usando os serviços abaixo.

```tsx
import { Sales } from "eitri-shopping-vtex-sales-app";

const status = await Sales.user.doLogin(email, password);
// status: 'Success' | 'WrongCredentials' | 'BlockedUser' | ...
```

Em caso de `Success`, o SDK autentica via VTEX ID, carrega `vendorData` via GraphQL, persiste `vendorData` e `salesAuthContext` no `sharedStorage` e publica `VENDOR_DATA_LOGGED`. O `AppProvider` reage ao evento e atualiza o contexto em todos os apps.

Checagem de sessão (JWT client-side + validação server-side):

```tsx
const { valid } = await Sales.user.checkSession();
if (!valid) {
  // logout / redirecionar para o login
}
```

Outros serviços úteis para as telas do vendedor:

```tsx
// Vendedores da loja (seleção de vendedor)
const vendors = await Sales.vendor.loadVendorsByStore(storeId);

// Painel de performance de vendas do mês
const performance = await Sales.performance.load(vendor);

// Identificar cliente no carrinho por e-mail ou CPF
await Sales.cart.identifyCustomer(orderFormId, value, sc, "email" | "cpf");

// Perfil completo do cliente por documento (inclui e-mail complementado via GraphQL)
const profile = await Sales.cart.getClientProfile(document);
console.log(profile.fullName?.data, profile.email?.data);

// Link de compartilhamento do carrinho (step de pagamento)
const url = await Sales.cart.getShareUrl(orderFormId);
```

---

## Componentes

### `SalesCode` (referência)

Componente para exibir o código do vendedor associado ao carrinho — implemente no app consumidor. O código fica em `cart.customData.customApps[id="sales-app"].fields.salesAgentCode`, preenchido pelo `Sales.cart.initSalesCart` via customData.

```tsx
import { View, Text } from "eitri-luminus";

export default function SalesCode({ cart }) {
  const salesAgentCode = cart?.customData?.customApps?.find(
    (app) => app.id === "sales-app",
  )?.fields?.salesAgentCode;

  if (!salesAgentCode) return <></>;

  return (
    <View className="flex items-center justify-between p-2">
      <Text className="text-xs">Código do vendedor</Text>
      <Text className="text-xs font-bold">{salesAgentCode}</Text>
    </View>
  );
}
```

---

## Exemplo completo

```tsx
import AppProvider, { useAppContext } from "./providers/AppProvider";
import { useLocalShoppingCart } from "./providers/LocalCart";
import SalesCode from "./components/SalesCode";
import { Sales } from "eitri-shopping-vtex-sales-app";

function CartPage() {
  const { isLogged } = useAppContext();
  const { cart, cartIsLoading, addItem, removeItem, isSalesMode } =
    useLocalShoppingCart();

  if (cartIsLoading) return <Loading />;

  return (
    <Page>
      {isSalesMode && <SalesCode cart={cart} />}
      {/* itens do carrinho */}
    </Page>
  );
}

export default function Root() {
  return (
    <AppProvider onConfigure={() => Sales.tryAutoConfigure()}>
      <CartPage />
    </AppProvider>
  );
}
```

---

## Referência rápida

**Facade `Sales`**

| Sub-serviço         | Principais métodos                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `Sales.user`        | `doLogin`, `checkSession`, `getGraphqlAuth`, `salesAppLogin`, `graphqlHeaders`, `isTokenExpired` |
| `Sales.vendor`      | `loadVendorData`, `loadVendorsByStore`, `getApolloClient`                                    |
| `Sales.cart`        | `initSalesCart`, `addItem`, `removeItem`, `identifyCustomer`, `getClientProfile`, `getVendor`, `getShareUrl`, `saveSalesAssisted` |
| `Sales.performance` | `load`                                                                                       |

**EventBus**

| Canal                    | Publicado por                                    | Consumido por                                                                    |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `VENDOR_DATA_LOGGED`     | `Sales.user.doLogin` (login com sucesso)         | `AppProvider`                                                                    |
| `SALES_CART_INITIALIZED` | `Sales.cart.initSalesCart`                       | `CartProvider` (instâncias secundárias)                                          |
| `SALES_CART_UPDATED`     | `CartProvider` após cada operação de cart        | `CartProvider` (outras instâncias, para sincronizar estado sem nova requisição)  |
| `SALES_CART_RELOAD`      | App que identifica o cliente (`identifyCustomer`) | `CartProvider` (todas as instâncias recarregam o carrinho)                       |

**SharedStorage**

| Chave                           | Conteúdo                                             |
| ------------------------------- | ---------------------------------------------------- |
| `"vendorData"`                  | `Vendor` (JSON)                                      |
| `"salesAuthContext"`            | `{ vtexIdToken, userContext }` (JSON)                |
| `"salesOrderFormId"`            | `string`                                             |
| `"salesCartInitLock"`           | `{ id, ts }` — lock TTL 15s (gerido pelo provider)   |
| `"associateCode:{orderFormId}"` | código de 6 caracteres gerado por sessão de carrinho |
