import WakeIntelligentSearchService from "./wake/WakeIntelligentSearchService"

export default class WakeService {
	static search = WakeIntelligentSearchService

	static configs = {
		account: '',
		tcs_account: '',
		api: '',
		host: '',
		searchOptions: {},
		segments: null
	}

	static configure = async remoteConfig => {
		const { providerInfo, segments, searchOptions, marketingTag } = remoteConfig

		const { account, tcs_account, host, faststore } = providerInfo

		let _host = host
		if (_host && !_host.startsWith('https://')) {
			_host = 'https://' + host
		}

		WakeService.configs = {
			account,
			tcs_account,
			api: `https://storefront-api.fbits.net/graphql`,
			host: _host,
			searchOptions,
			segments,
			faststore,
			marketingTag: marketingTag ?? 'eitri-shop'
		}
	}

}
