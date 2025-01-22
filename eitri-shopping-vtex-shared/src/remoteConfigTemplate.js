/**
 * Configurações do Eitri para integração com a plataforma VTEX.
 * Este objeto define as configurações principais do provedor, preferências da loja,
 * opções de busca e comportamento do aplicativo.
 * campos com * são obrigatórios.
 */
const remoteConfigTemplate = {
  ecommerceProvider: "VTEX", // Não utilizado.,
  providerInfo: {
    account: "torratorra", //* Conta VTEX
    faststore: "lojastorra", //* Project ID do Faststore
    vtexCmsUrl: "https://euentregobr.myvtex.com/", // URL do CMS VTEX - necessário apenas se o CMS estiver estiver em uma conta diferente da principal.
    host: "www.lojastorra.com.br" //* Host público do e-commerce
  },
  appConfigs: {
    clarityId: "YOUR_CLARITY_ID", // ID do Clarity
    autoTriggerGAEvents: true, // Se habilitado, o aplicativo irá automaticamente disparar eventos de ecommerce para o Google Analytics. Habilitado por padrão.
    statusBarTextColor: "black", // Cor do texto na Status Bar do dispositivo.
    headerLogo: "", // URL da logo do header.
    headerBackgroundColor: "secondary-500", // Cor do background do header.
    headerContentColor: "neutral-900", // Cor do conteúdo do header.
    productCard: { // Configurações do card de produto [em desenvolvimento].
      style: "fullImage", // Estilo do card de produto. Apenas [fullImage] ou vazio para o padrão default estão disponíveis.
      showListPrice: false, // Mostrar preço de tabela no card de produto.
      buyGoesToPDP: true // Indica se o botão "Comprar" irá direcionar para o PDP ao invés de adicionar ao carrinho.
    }
  },
  storePreferences: {
    displayCompanyName: "Lojas Torra", //* Nome da loja para exibição.
    currencyCode: "BRL", // Código da moeda.
    locale: "pt-BR", // Localidade.
    segments: { // Informaçoes de segmentos Vtex, todos os campos inseridos serão utilizados para a criação da session.
      campaigns: null,
      channel: "1",
      priceTables: null,
      regionId: null,
      utm_campaign: null,
      utm_source: "eitri-shop-source",
      utmi_campaign: null,
      currencyCode: "BRL",
      currencySymbol: "R$",
      countryCode: "BRA",
      cultureInfo: "pt-BR",
      admin_cultureInfo: "pt-BR",
      channelPrivacy: "public"
    },
    marketingTag: "eitri-shop", // Tag de marketing associada à loja - importante para identifição da compra. Se não enviada "eitri-shop" será a padrão.
    salesChannel: "1" // Canal de vendas configurado - importante para identificação da compra. Se não enviada "1" será a padrão.
  },
  searchOptions: {
    legacySearch: false // Se `true`, habilita o modo de busca legado ao invés do intelligent search.
  },
  /**
   * Configuraçoes da bottom bar nativa. O array é posicional, deve ser preenchido seguindo a ordem da bottom bar.
   */
  eitriConfig: {
    mainApp: "eitri-shopping-demo-home", // Slug da main app.
    bottomNavItems: [
      {
        slug: "eitri-shopping-demo-home", // Slug da app a ser aberto nesta posição.
        initParams: { tabIndex: 0 } // Parâmetros iniciais para a app.
      },
      {
        slug: "eitri-shopping-demo-home",
        initParams: { tabIndex: 1, route: "Categories" }
      },
      {
        slug: "eitri-shopping-demo-cart",
        initParams: { tabIndex: 2 }
      },
      {
        slug: "eitri-shopping-demo-home",
        initParams: {
          tabIndex: 3,
          route: "LandingPage",
          landingPageName: "CartaoTorra",
          pageTitle: "Cartão Torra"
        }
      },
      {
        slug: "eitri-shopping-demo-account",
        initParams: { tabIndex: 4 }
      }
    ]
  }
};
