import Eitri from 'eitri-bifrost'
import isVersionGreater from '@/utils/isVersionGreater'

export default class EventBus {

	static BROADCAST_ALLOWED = null

	static async isBroadcastAllowed() {
		if (EventBus.BROADCAST_ALLOWED !== null) {
			return EventBus.BROADCAST_ALLOWED
		}

		const MIN_IOS_VERSION_BROADCAST = '15.4'
		const device = await Eitri.device.getInfos()
		EventBus.BROADCAST_ALLOWED = !(device.platform === 'ios' && !isVersionGreater(device.osVersion, MIN_IOS_VERSION_BROADCAST))

		return EventBus.BROADCAST_ALLOWED
	}

	static async subscribe(payload) {
		try {
			if (payload.broadcast && !(await EventBus.isBroadcastAllowed())) {
				const { broadcast, ...rest } = payload
				return Eitri.eventBus.subscribe(rest);
			}
			return Eitri.eventBus.subscribe(payload);
		} catch (e) {
			console.error('Erro ao subscrever evento', e)
		}
	}

	static async publish(payload) {
		try {
			if (payload.broadcast && !(await EventBus.isBroadcastAllowed())) {
				const { broadcast, ...rest } = payload
				return Eitri.eventBus.publish(rest);

			}
			return Eitri.eventBus.publish(payload);
		} catch (e) {
			console.error('Erro ao publicar evento', e)
		}
	}
}