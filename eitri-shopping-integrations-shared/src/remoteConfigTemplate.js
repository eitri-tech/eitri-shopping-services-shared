/**
 * Configurações do Eitri para integração com diferentes plataformas de e-commerce.
 * Este objeto define as configurações principais para diferentes provedores,
 * preferências da loja e comportamento do aplicativo.
 * campos com * são obrigatórios.
 */
const remoteConfigTemplate = {
  ecommerceProvider: "GENERIC", // Provedor de e-commerce genérico
  providerInfo: {
    account: "your_account", //* Conta do provedor
    host: "www.yourstore.com", //* Host público do e-commerce
    apiUrl: "https://api.yourstore.com", // URL da API
  },
  appConfigs: {
    clarityId: "YOUR_CLARITY_ID", // ID do Clarity
    autoTriggerGAEvents: true, // Se habilitado, o aplicativo irá automaticamente disparar eventos de ecommerce para o Google Analytics. Habilitado por padrão.
    statusBarTextColor: "black", // Cor do texto na Status Bar do dispositivo.
    headerLogo: "", // URL da logo do header.
    headerBackgroundColor: "secondary-500", // Cor do background do header.
    headerContentColor: "neutral-900", // Cor do conteúdo do header.
    gaVerbose: false, // Se habilitado, irá exibir logs detalhados do Google Analytics.
    verbose: false, // Se habilitado, irá exibir logs detalhados do aplicativo.
  },
  storePreferences: {
    displayCompanyName: "Your Store", //* Nome da loja para exibição.
    currencyCode: "BRL", // Código da moeda.
    locale: "pt-BR", // Localidade.
  },
  /**
   * Configurações da bottom bar nativa. O array é posicional, deve ser preenchido seguindo a ordem da bottom bar.
   */
  eitriConfig: {
    mainApp: "eitri-shopping-integrations-shared", // Slug da main app.
    bottomNavItems: [
      {
        slug: "eitri-shopping-integrations-shared", // Slug da app a ser aberto nesta posição.
        initParams: { tabIndex: 0 }, // Parâmetros iniciais para a app.
      },
    ],
  },
};

export default remoteConfigTemplate;
