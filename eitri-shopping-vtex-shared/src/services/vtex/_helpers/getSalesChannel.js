import RemoteConfig from '../../RemoteConfig'

export default async function getSalesChannel() {
	return RemoteConfig.getContent('storePreferences.salesChannel')
}
