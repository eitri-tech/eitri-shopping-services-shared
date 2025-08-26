import Eitri from 'eitri-bifrost'

export default async function getSalesChannel() {
	const remoteConfig = await Eitri.environment.getRemoteConfigs()
	return remoteConfig?.storePreferences?.salesChannel
}
