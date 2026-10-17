import VtexCaller from '../_helpers/_vtexCaller'
import VtexCustomerService from '../customer/vtexCustomerService'
import objectToQueryString from '../_helpers/objectToQueryString'
import { sendLogError } from '@/services/Datadog'
import type {
	Subscription,
	SubscriptionConversationMessage,
	SubscriptionCreateRequest,
	SubscriptionCycle,
	SubscriptionCycleListFilters,
	SubscriptionItemRequest,
	SubscriptionItemUpdateRequest,
	SubscriptionListFilters,
	SubscriptionSimulation,
	SubscriptionUpdateRequest
} from '@/models/Subscription'

const SUBSCRIPTIONS_PATH = 'api/rns/pub/subscriptions'
const CYCLES_PATH = 'api/rns/pub/cycles'

export default class VtexSubscriptionService {
	static async listSubscriptions(filters: SubscriptionListFilters = {}): Promise<Subscription[]> {
		try {
			const customerEmail = await VtexSubscriptionService.getCustomerEmail()
			const query = objectToQueryString(VtexSubscriptionService.compact({ customerEmail, ...filters }))
			const response = await VtexCaller.get(`${SUBSCRIPTIONS_PATH}?${query}`)
			return response.data
		} catch (e: any) {
			sendLogError(e, 'listSubscriptions')
			throw e
		}
	}

	static async getSubscription(id: string): Promise<Subscription> {
		try {
			const response = await VtexCaller.get(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}`)
			return response.data
		} catch (e: any) {
			sendLogError(e, 'getSubscription', { subscriptionId: id ?? null })
			throw e
		}
	}

	static async createSubscription(payload: SubscriptionCreateRequest): Promise<Subscription> {
		try {
			const customerEmail = payload.customerEmail ?? (await VtexSubscriptionService.getCustomerEmail())
			const response = await VtexCaller.post(SUBSCRIPTIONS_PATH, { ...payload, customerEmail })
			return response.data
		} catch (e: any) {
			sendLogError(e, 'createSubscription')
			throw e
		}
	}

	static async updateSubscription(id: string, payload: SubscriptionUpdateRequest): Promise<Subscription> {
		try {
			const customerEmail = payload.customerEmail ?? (await VtexSubscriptionService.getCustomerEmail())
			const response = await VtexCaller.patch(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}`, {
				...payload,
				customerEmail
			})
			return response.data
		} catch (e: any) {
			sendLogError(e, 'updateSubscription', { subscriptionId: id ?? null })
			throw e
		}
	}

	static async addItem(id: string, item: SubscriptionItemRequest): Promise<Subscription> {
		try {
			const response = await VtexCaller.post(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}/items`, item)
			return response.data
		} catch (e: any) {
			sendLogError(e, 'addSubscriptionItem', { subscriptionId: id ?? null })
			throw e
		}
	}

	static async updateItem(id: string, itemId: string, payload: SubscriptionItemUpdateRequest): Promise<Subscription> {
		try {
			const response = await VtexCaller.patch(
				`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
				payload
			)
			return response.data
		} catch (e: any) {
			sendLogError(e, 'updateSubscriptionItem', { subscriptionId: id ?? null, itemId: itemId ?? null })
			throw e
		}
	}

	static async removeItem(id: string, itemId: string): Promise<void> {
		try {
			await VtexCaller.delete(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`)
		} catch (e: any) {
			sendLogError(e, 'removeSubscriptionItem', { subscriptionId: id ?? null, itemId: itemId ?? null })
			throw e
		}
	}

	static async simulateSubscription(id: string): Promise<SubscriptionSimulation> {
		try {
			const response = await VtexCaller.post(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}/simulate`, {})
			return response.data
		} catch (e: any) {
			sendLogError(e, 'simulateSubscription', { subscriptionId: id ?? null })
			throw e
		}
	}

	static async simulate(payload: SubscriptionCreateRequest): Promise<SubscriptionSimulation> {
		try {
			const customerEmail = payload.customerEmail ?? (await VtexSubscriptionService.getCustomerEmail())
			const response = await VtexCaller.post(`${SUBSCRIPTIONS_PATH}/simulate`, { ...payload, customerEmail })
			return response.data
		} catch (e: any) {
			sendLogError(e, 'simulateNewSubscription')
			throw e
		}
	}

	static async getConversationMessages(subscriptionId: string): Promise<SubscriptionConversationMessage[]> {
		try {
			const response = await VtexCaller.get(
				`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(subscriptionId)}/conversation-message`
			)
			return response.data
		} catch (e: any) {
			sendLogError(e, 'getConversationMessages', { subscriptionId: subscriptionId ?? null })
			throw e
		}
	}

	static async listCycles(filters: SubscriptionCycleListFilters = {}): Promise<SubscriptionCycle[]> {
		try {
			const customerEmail =
				filters.customerEmail ??
				(filters.subscriptionId ? undefined : await VtexSubscriptionService.getCustomerEmail())
			const query = objectToQueryString(VtexSubscriptionService.compact({ ...filters, customerEmail }))
			const response = await VtexCaller.get(`${CYCLES_PATH}?${query}`)
			return response.data
		} catch (e: any) {
			sendLogError(e, 'listCycles', { subscriptionId: filters?.subscriptionId ?? null })
			throw e
		}
	}

	static async getCycle(cycleId: string): Promise<SubscriptionCycle> {
		try {
			const response = await VtexCaller.get(`${CYCLES_PATH}/${encodeURIComponent(cycleId)}`)
			return response.data
		} catch (e: any) {
			sendLogError(e, 'getCycle', { cycleId: cycleId ?? null })
			throw e
		}
	}

	static async retryCycle(cycleId: string): Promise<void> {
		try {
			await VtexCaller.post(`${CYCLES_PATH}/${encodeURIComponent(cycleId)}/retry`, {})
		} catch (e: any) {
			sendLogError(e, 'retryCycle', { cycleId: cycleId ?? null })
			throw e
		}
	}

	static async getCustomerEmail(): Promise<string> {
		const storedEmail = await VtexCustomerService.getCustomerData('email')
		if (storedEmail) return storedEmail

		const profile = await VtexCustomerService.getCustomerProfile()
		const email = profile?.data?.profile?.email
		if (!email) throw new Error('User not logged')

		await VtexCustomerService.setCustomerData('email', email)
		return email
	}

	static compact(obj: Record<string, any>): Record<string, any> {
		return Object.fromEntries(Object.entries(obj).filter(([, value]) => value != null && value !== ''))
	}
}
