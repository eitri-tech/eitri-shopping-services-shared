import Eitri from 'eitri-bifrost'

export default class Widde {

    static config = {
        apiUrl: 'https://api-admin.widde.io/api/story/stories-collection/_'
    }

    static setConfig(options) {
        Widde.config = {...Widde.config, ...options}
    }

    static getWiddeConfig = async () => {
        try {
            const remoteConfig = await Eitri.environment.getRemoteConfigs()
            const domain = remoteConfig?.providerInfo?.domain || remoteConfig?.providerInfo?.host

            return {
                enable: remoteConfig?.widde?.enable === true,
                storeBaseUrl: domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : null,
            }
        } catch (e) {
            console.error('Erro ao ler remote config da Widde', e)
            return { enable: false, storeBaseUrl: null }
        }
    }

    static getMidiaByProductSlug = async (productSlug, storeBaseUrl) => {

        if (!productSlug.toLowerCase().startsWith('http') && !productSlug.toLowerCase().startsWith('www')) {
            productSlug = `${storeBaseUrl}/${productSlug.replace(/^\//, '')}`
        }

        const productUrl = new URL(productSlug)
        productUrl.protocol = 'https:'

        const widdeUrl = new URL(Widde.config.apiUrl)
        widdeUrl.searchParams.set('url', productUrl.href)
        widdeUrl.searchParams.set('loadStories', true)
        widdeUrl.searchParams.set('generateViewKey', true)
        widdeUrl.searchParams.set('collectionViewType', 'Story')
        widdeUrl.searchParams.set('webcomponent', 'widde-floating-block')
        widdeUrl.searchParams.set('pageType', 'Product')

        const headers = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'ecommerce-token': 'BR',
                'Referer': 'mobile'
            },
        }

        try {
            const response = await Eitri.http.get(widdeUrl.href, headers)
            return response?.data?.data?.storiesCollections?.collection?.storiesWithLazyLoad || null
        } catch (e) {
            console.error('Erro ao buscar midia', e)
        }

        return null
    }
}
