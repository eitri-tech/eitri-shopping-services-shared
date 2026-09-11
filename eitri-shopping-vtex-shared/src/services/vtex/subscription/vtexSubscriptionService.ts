import VtexCaller from '../_helpers/_vtexCaller'
import VtexCustomerService from '../customer/vtexCustomerService'
import objectToQueryString from '../_helpers/objectToQueryString'
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
		const customerEmail = await VtexSubscriptionService.getCustomerEmail()
		const query = objectToQueryString(VtexSubscriptionService.compact({ customerEmail, ...filters }))
		const response = await VtexCaller.get(`${SUBSCRIPTIONS_PATH}?${query}`)
		return response.data
	}

	static async getSubscription(id: string): Promise<Subscription> {
		const response = await VtexCaller.get(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}`)
		return response.data
	}

	static async createSubscription(payload: SubscriptionCreateRequest): Promise<Subscription> {
		const customerEmail = payload.customerEmail ?? (await VtexSubscriptionService.getCustomerEmail())
		const response = await VtexCaller.post(SUBSCRIPTIONS_PATH, { ...payload, customerEmail })
		return response.data
	}

	static async updateSubscription(id: string, payload: SubscriptionUpdateRequest): Promise<Subscription> {
		const customerEmail = payload.customerEmail ?? (await VtexSubscriptionService.getCustomerEmail())
		const response = await VtexCaller.patch(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}`, {
			...payload,
			customerEmail
		})
		return response.data
	}

	static async addItem(id: string, item: SubscriptionItemRequest): Promise<Subscription> {
		const response = await VtexCaller.post(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}/items`, item)
		return response.data
	}

	static async updateItem(id: string, itemId: string, payload: SubscriptionItemUpdateRequest): Promise<Subscription> {
		const response = await VtexCaller.patch(
			`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
			payload
		)
		return response.data
	}

	static async removeItem(id: string, itemId: string): Promise<void> {
		await VtexCaller.delete(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`)
	}

	static async simulateSubscription(id: string): Promise<SubscriptionSimulation> {
		const response = await VtexCaller.post(`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}/simulate`, {})
		return response.data
	}

	static async simulate(payload: SubscriptionCreateRequest): Promise<SubscriptionSimulation> {
		const customerEmail = payload.customerEmail ?? (await VtexSubscriptionService.getCustomerEmail())
		const response = await VtexCaller.post(`${SUBSCRIPTIONS_PATH}/simulate`, { ...payload, customerEmail })
		return response.data
	}

	static async getConversationMessages(subscriptionId: string): Promise<SubscriptionConversationMessage[]> {
		const response = await VtexCaller.get(
			`${SUBSCRIPTIONS_PATH}/${encodeURIComponent(subscriptionId)}/conversation-message`
		)
		return response.data
	}

	static async listCycles(filters: SubscriptionCycleListFilters = {}): Promise<SubscriptionCycle[]> {
		const customerEmail =
			filters.customerEmail ??
			(filters.subscriptionId ? undefined : await VtexSubscriptionService.getCustomerEmail())
		const query = objectToQueryString(VtexSubscriptionService.compact({ ...filters, customerEmail }))
		const response = await VtexCaller.get(`${CYCLES_PATH}?${query}`)
		return response.data
	}

	static async getCycle(cycleId: string): Promise<SubscriptionCycle> {
		const response = await VtexCaller.get(`${CYCLES_PATH}/${encodeURIComponent(cycleId)}`)
		return response.data
	}

	static async retryCycle(cycleId: string): Promise<void> {
		await VtexCaller.post(`${CYCLES_PATH}/${encodeURIComponent(cycleId)}/retry`, {})
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
