import Eitri from 'eitri-bifrost'

import type {
	ActiveOrderNotification,
	ContentConfig,
	LiveNotificationServiceConfig,
	OrderNotificationInput,
	OrderStatusInput,
	OrderStatusModule,
	OrderStatusPreset,
	OrderStatusPresets,
	PermissionResult,
	PushPermissionStatus,
	RemoteContentConfig,
	SkipParams,
	StartOptions,
	StartResult,
	StartResultReason,
	TrackParams
} from '../models/LiveNotification'

export const PUSH_PERMISSION_STATUS: Record<PushPermissionStatus, PushPermissionStatus> = {
	GRANTED: 'GRANTED',
	DENIED: 'DENIED',
	BLOCKED: 'BLOCKED'
}

export const START_RESULT_REASON: Record<string, StartResultReason> = {
	STARTED: 'started',
	ALREADY_ACTIVE: 'already_active',
	UNSUPPORTED: 'unsupported',
	MISSING_ORDER_ID: 'missing_order_id',
	PERMISSION_DENIED: 'permission_denied',
	FEATURE_DISABLED: 'feature_disabled',
	ERROR: 'error'
}

export const LIVE_NOTIFICATION_EVENTS = {
	VIEW: 'live_notification_view',
	CLICK: 'live_notification_click',
	START: 'live_notification_start'
} as const

export const ALLOW_ALL_TOKEN = '*'

/**
 * Status iniciais — os unicos disparados pelo app; as transicoes seguintes chegam por push
 * do webhook das transportadoras. Sao o fallback do remote config, que vence campo por campo.
 */
export const DEFAULT_ORDER_STATUS_PRESETS: OrderStatusPresets = {
	confirmed: {
		displayName: 'Pedido confirmado',
		icon: 'checkmark.circle.fill',
		progress: 0.15,
		message: 'Pagamento aprovado. Já vamos separar seus itens.'
	},
	confirmed_pickup: {
		displayName: 'Pedido confirmado',
		icon: 'checkmark.circle.fill',
		progress: 0.15,
		message: 'Pagamento aprovado. Avisaremos quando estiver pronto para retirada.'
	}
}

const LOG_METHOD_START = 'LiveNotificationService.startOrderStatusNotification'
const LOG_METHOD_SKIP = 'LiveNotificationService.logSkippedOrderStatusNotification'

let config: LiveNotificationServiceConfig = {
	storeName: '',
	presets: DEFAULT_ORDER_STATUS_PRESETS,
	allowedEmailsConfigKey: 'appConfigs.liveNotificationAllowedEmails',
	contentConfigKey: 'appConfigs.liveNotification',
	trackers: [],
	logger: null
}

let allowedEmailsCache: string[] | null = null
let contentConfigCache: ContentConfig | null = null
let deviceParamsCache: Record<string, string | number> | null = null

const isObject = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value)

const text = (value: unknown): string => `${value ?? ''}`.trim()

const getRemoteConfigProperty = async (key: string): Promise<unknown> => {
	if (!key) {
		return null
	}

	const remoteConfig = await Eitri.environment.getRemoteConfigs()

	if (!remoteConfig) {
		return null
	}

	return key.split('.').reduce<unknown>((obj, part) => (isObject(obj) ? obj[part] : undefined), remoteConfig) ?? null
}

const normalizeEmailList = (configured: unknown): string[] => {
	const rawList = Array.isArray(configured) ? configured : text(configured).split(/[,;\n]/)

	return rawList.map(item => text(item).toLowerCase()).filter(Boolean)
}

const clampProgress = (value: unknown): number => {
	const parsed = Number(value)

	if (isNaN(parsed)) {
		return 0
	}

	return Math.min(1, Math.max(0, parsed))
}

/** O remote config vence o default campo por campo; status novo no remote tambem passa a valer. */
const mergePresets = (remoteStatuses: unknown): OrderStatusPresets => {
	const remote = isObject(remoteStatuses) ? remoteStatuses : {}
	const keys = new Set([...Object.keys(config.presets), ...Object.keys(remote)])
	const merged: OrderStatusPresets = {}

	keys.forEach(key => {
		const base = config.presets[key] || ({} as Partial<OrderStatusPreset>)
		const override = isObject(remote[key]) ? (remote[key] as Partial<OrderStatusPreset>) : {}

		merged[key] = {
			displayName: override.displayName || base.displayName || '',
			icon: override.icon || base.icon || '',
			progress: clampProgress(override.progress ?? base.progress),
			message: override.message || base.message || ''
		}
	})

	return merged
}

const resolvePreset = (status: unknown, presets: OrderStatusPresets): Partial<OrderStatusPreset> => {
	const preset = typeof status === 'string' ? presets[status] : null

	return preset || presets.confirmed || DEFAULT_ORDER_STATUS_PRESETS.confirmed
}

const resolveStatus = (
	status: string | OrderStatusInput | undefined,
	presets: OrderStatusPresets
): Required<OrderStatusInput> => {
	const custom = isObject(status) ? (status as OrderStatusInput) : {}
	const base = resolvePreset(status, presets)

	return {
		displayName: custom.displayName || base.displayName || '',
		icon: custom.icon || base.icon || '',
		progress: clampProgress(custom.progress ?? base.progress)
	}
}

/** Texto do preset (remoto ou default), a menos que o caller passe um proprio. */
const resolveMessage = (
	status: string | OrderStatusInput | undefined,
	message: string | undefined,
	presets: OrderStatusPresets
): string => message || resolvePreset(status, presets).message || ''

export default class LiveNotificationService {
	static REASON = START_RESULT_REASON
	static EVENTS = LIVE_NOTIFICATION_EVENTS

	/**
	 * Injeta o que e especifico do app: nome da loja, presets, chaves de remote config e os
	 * destinos de tracking/log. Sem isso o servico funciona com os defaults e sem telemetria.
	 */
	static configure(options: Partial<LiveNotificationServiceConfig>): void {
		config = { ...config, ...options }
		this.clearCache()
	}

	static getConfig(): LiveNotificationServiceConfig {
		return config
	}

	static clearCache(): void {
		allowedEmailsCache = null
		contentConfigCache = null
	}

	/** Lista de e-mails liberados, normalizada e cacheada por sessao. */
	static async getAllowedEmails(): Promise<string[]> {
		if (allowedEmailsCache) {
			return allowedEmailsCache
		}

		try {
			allowedEmailsCache = normalizeEmailList(await getRemoteConfigProperty(config.allowedEmailsConfigKey))

			return allowedEmailsCache
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao ler lista de e-mails liberados', e)

			return []
		}
	}

	/**
	 * Conteudo da notificacao vindo do remote config. Tudo opcional — campo ausente cai no
	 * default injetado em `configure`:
	 *
	 * ```json
	 * {
	 *   "storeName": "Minha Loja",
	 *   "statuses": {
	 *     "confirmed": { "displayName": "Pedido confirmado", "icon": "checkmark.circle.fill", "progress": 0.15, "message": "..." }
	 *   }
	 * }
	 * ```
	 */
	static async getContentConfig(): Promise<ContentConfig> {
		if (contentConfigCache) {
			return contentConfigCache
		}

		let configured: unknown = null

		try {
			configured = await getRemoteConfigProperty(config.contentConfigKey)
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao ler conteudo da live notification', e)
		}

		const remote: RemoteContentConfig = isObject(configured) ? configured : {}

		contentConfigCache = {
			storeName: text(remote.storeName) || config.storeName,
			presets: mergePresets(remote.statuses)
		}

		return contentConfigCache
	}

	/** Feature toggle. Lista vazia mantem a feature desligada — default seguro do rollout. */
	static async isEnabledForEmail(email?: string): Promise<boolean> {
		const allowed = await this.getAllowedEmails()

		if (!allowed.length) {
			return false
		}

		if (allowed.includes(ALLOW_ALL_TOKEN)) {
			return true
		}

		const normalizedEmail = text(email).toLowerCase()

		return !!normalizedEmail && allowed.includes(normalizedEmail)
	}

	/** Modulo nativo de live notification, ou null quando o host nao o expoe. */
	static async getOrderStatusModule(): Promise<OrderStatusModule | null> {
		try {
			const modules = (await Eitri.modules()) as Record<string, unknown> | null

			const module = modules?.orderStatusLiveNotification

			return isObject(module) ? (module as OrderStatusModule) : null
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao carregar modules', e)

			return null
		}
	}

	/** iOS 16.2+ / Android 16 (API 36)+. */
	static async isOrderStatusSupported(): Promise<boolean> {
		const module = await this.getOrderStatusModule()

		if (typeof module?.isSupported !== 'function') {
			return false
		}

		try {
			return !!(await module.isSupported())
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao verificar suporte', e)

			return false
		}
	}

	static async checkPushPermission(): Promise<PushPermissionStatus | null> {
		try {
			const result = (await Eitri.notification.checkPermission()) as { status?: PushPermissionStatus } | null

			return result?.status || null
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao verificar permissão de push', e)

			return null
		}
	}

	static async requestPushPermission(): Promise<PushPermissionStatus | null> {
		try {
			const result = (await Eitri.notification.requestPermission()) as { status?: PushPermissionStatus } | null

			return result?.status || null
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao solicitar permissão de push', e)

			return null
		}
	}

	/** `'BLOCKED'` nao dispara prompt — so os ajustes do SO revertem esse estado. */
	static async ensurePushPermission(): Promise<PermissionResult> {
		const status = await this.checkPushPermission()

		if (status === PUSH_PERMISSION_STATUS.GRANTED) {
			return { granted: true, status, requested: false }
		}

		if (status === PUSH_PERMISSION_STATUS.BLOCKED) {
			return { granted: false, status, requested: false }
		}

		const requestedStatus = await this.requestPushPermission()

		return {
			granted: requestedStatus === PUSH_PERMISSION_STATUS.GRANTED,
			status: requestedStatus,
			requested: true
		}
	}

	static async getActiveOrderNotifications(): Promise<ActiveOrderNotification[]> {
		const module = await this.getOrderStatusModule()

		if (typeof module?.getActiveNotifications !== 'function') {
			return []
		}

		try {
			const activities = await module.getActiveNotifications()

			return Array.isArray(activities) ? (activities.filter(isObject) as ActiveOrderNotification[]) : []
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao buscar notificacoes ativas', e)

			return []
		}
	}

	/** Sem orderId, retorna a primeira notificacao ativa (se houver). */
	static async getActiveOrderNotification(orderId?: string): Promise<ActiveOrderNotification | null> {
		const activities = await this.getActiveOrderNotifications()

		if (!orderId) {
			return activities[0] || null
		}

		return activities.find(activity => `${activity?.orderId}` === `${orderId}`) || null
	}

	static async hasActiveOrderNotification(orderId?: string): Promise<boolean> {
		return !!(await this.getActiveOrderNotification(orderId))
	}

	/**
	 * Inicia a live notification do pedido. Se ja existir uma ativa para o mesmo orderId,
	 * nao inicia outra e devolve a existente.
	 *
	 * O conteudo exibido segue a precedencia `order` > remote config > default injetado.
	 */
	static async startOrderStatusNotification(order: OrderNotificationInput, options?: StartOptions): Promise<StartResult> {
		let result: StartResult | undefined
		let unexpectedError: unknown = null

		try {
			result = await this.resolveStartOrderStatusNotification(order, options)
		} catch (e) {
			unexpectedError = e
			console.error('[LiveNotificationService] Falha inesperada ao iniciar live notification', e)
		}

		// O caller nunca recebe undefined, mesmo quando o resolve lanca.
		const safeResult: StartResult = result || {
			started: false,
			reason: START_RESULT_REASON.ERROR,
			orderId: text(order?.orderId),
			activityId: null,
			permissionStatus: null,
			errorMessage: text((unexpectedError as Error)?.message || unexpectedError) || 'erro desconhecido'
		}

		// Usuario fora do toggle nunca viu a feature: mandar evento sujaria o funil.
		if (safeResult.reason !== START_RESULT_REASON.FEATURE_DISABLED) {
			this.trackStartResult(safeResult, order, options)
		}

		return safeResult
	}

	/**
	 * Device achatado em params do evento, cacheado por sessao. O suporte depende da versao
	 * do SO (iOS 16.2+ / Android 16), entao sem isso nao da pra separar `unsupported` de
	 * falha real.
	 */
	static async getDeviceParams(): Promise<Record<string, string | number>> {
		if (deviceParamsCache) {
			return deviceParamsCache
		}

		let infos: unknown = null

		try {
			infos = await Eitri.device.getInfos()
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao obter infos do device', e)
		}

		const device: Record<string, unknown> = isObject(infos) ? infos : {}
		const android = isObject(device.android) ? device.android : {}
		const apiLevel = Number(android.apiLevel)

		deviceParamsCache = {
			device_platform: `${device.platform ?? ''}`,
			device_os_version: `${device.osVersion ?? ''}`,
			device_brand: `${device.brand ?? ''}`,
			device_model: `${device.model ?? ''}`,
			device_android_api_level: isNaN(apiLevel) ? '' : apiLevel
		}

		return deviceParamsCache
	}

	/**
	 * Dispara o evento em todos os trackers injetados. Cada envio e isolado: um tracker que
	 * rejeita nao pode derrubar os outros nem gerar rejeicao nao tratada.
	 */
	static dispatchTracking(eventName: string, params: Record<string, unknown>): void {
		if (!config.trackers.length) {
			return
		}

		Promise.resolve(this.getDeviceParams())
			.catch(() => ({}))
			.then(deviceParams => {
				const payload = { ...deviceParams, ...params }

				config.trackers.forEach((tracker, index) => {
					if (typeof tracker !== 'function') {
						return
					}

					try {
						Promise.resolve(tracker(eventName, payload)).catch(e =>
							console.error(`[LiveNotificationService] Falha no tracking (${index})`, e)
						)
					} catch (e) {
						console.error(`[LiveNotificationService] Falha no tracking (${index})`, e)
					}
				})
			})
	}

	/** Impressao do bloco de acompanhamento. Le a permissao sem abrir prompt — medir nao pode provocar o prompt nativo. */
	static async trackView(params?: TrackParams): Promise<void> {
		await this.trackInteraction(LIVE_NOTIFICATION_EVENTS.VIEW, params)
	}

	/** Clique no botao, antes de qualquer prompt — mede intencao, nao resultado. */
	static async trackClick(params?: TrackParams): Promise<void> {
		await this.trackInteraction(LIVE_NOTIFICATION_EVENTS.CLICK, params)
	}

	private static async trackInteraction(eventName: string, params?: TrackParams): Promise<void> {
		const permissionStatus = await this.checkPushPermission()

		this.dispatchTracking(eventName, {
			order_id: text(params?.orderId),
			origin: params?.origin || '',
			permission_status: permissionStatus || 'UNKNOWN',
			push_enabled: permissionStatus === PUSH_PERMISSION_STATUS.GRANTED,
			...params?.extra
		})
	}

	/** Desfecho da tentativa de start. Nao e aguardado: tracking nunca segura a UI. */
	static trackStartResult(result: StartResult, order?: OrderNotificationInput, options?: StartOptions): void {
		const params: Record<string, unknown> = {
			status: result?.reason || '',
			order_id: text(result?.orderId),
			order_status: typeof order?.status === 'string' ? order.status : 'custom',
			permission_status: result?.permissionStatus || '',
			origin: options?.origin || '',
			...(options?.diagnostics || {})
		}

		this.dispatchTracking(LIVE_NOTIFICATION_EVENTS.START, params)

		const data = { ...params, activity_id: text(result?.activityId) }
		const failedToStart = !result?.started && result?.reason !== START_RESULT_REASON.ALREADY_ACTIVE

		if (failedToStart) {
			config.logger?.error?.({
				name: 'LiveNotificationStartError',
				message: result?.errorMessage || `Live notification não iniciada: ${params.status}`,
				method: LOG_METHOD_START,
				data
			})

			return
		}

		// O sucesso e o denominador: sem ele nao da pra separar "nao disparou" de "nao tentou".
		this.getDeviceParams()
			.catch(() => ({}))
			.then(deviceParams =>
				config.logger?.info?.({
					name: 'LiveNotificationStarted',
					message: `Live notification ativa: ${params.status}`,
					method: LOG_METHOD_START,
					data: { ...deviceParams, ...data }
				})
			)
	}

	/**
	 * Registra que a tela decidiu NAO chamar o start. Diagnostico puro: vai so para o logger,
	 * nunca para o funil de analytics. Quando o e-mail e informado e esta fora do toggle, nada
	 * e logado — a feature nunca existiu para esse usuario.
	 *
	 * @returns os dados enviados, ou null quando nada foi logado
	 */
	static async logSkippedOrderStatusNotification(params: SkipParams): Promise<Record<string, unknown> | null> {
		try {
			const userEmail = text(params?.userEmail)

			if (userEmail && !(await this.isEnabledForEmail(userEmail))) {
				return null
			}

			const data: Record<string, unknown> = {
				skip_reason: params?.skipReason || '',
				order_id: text(params?.orderId),
				origin: params?.origin || '',
				has_user_email: !!userEmail,
				...(params?.diagnostics || {})
			}

			config.logger?.error?.({
				name: 'LiveNotificationSkipped',
				message: `Live notification não disparada: ${data.skip_reason}`,
				method: LOG_METHOD_SKIP,
				data
			})

			return data
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao registrar skip da live notification', e)

			return null
		}
	}

	static async resolveStartOrderStatusNotification(
		order: OrderNotificationInput,
		options?: StartOptions
	): Promise<StartResult> {
		const orderId = text(order?.orderId)

		if (!orderId) {
			return {
				started: false,
				reason: START_RESULT_REASON.MISSING_ORDER_ID,
				orderId: '',
				activityId: null,
				permissionStatus: null
			}
		}

		if (!(await this.isEnabledForEmail(options?.userEmail))) {
			return {
				started: false,
				reason: START_RESULT_REASON.FEATURE_DISABLED,
				orderId,
				activityId: null,
				permissionStatus: null
			}
		}

		const module = await this.getOrderStatusModule()

		if (typeof module?.start !== 'function') {
			return {
				started: false,
				reason: START_RESULT_REASON.UNSUPPORTED,
				orderId,
				activityId: null,
				permissionStatus: null
			}
		}

		if (typeof module.isSupported === 'function') {
			try {
				if (!(await module.isSupported())) {
					return {
						started: false,
						reason: START_RESULT_REASON.UNSUPPORTED,
						orderId,
						activityId: null,
						permissionStatus: null
					}
				}
			} catch (e) {
				console.error('[LiveNotificationService] Falha ao verificar suporte', e)
			}
		}

		const active = await this.getActiveOrderNotification(orderId)

		if (active) {
			return {
				started: false,
				reason: START_RESULT_REASON.ALREADY_ACTIVE,
				orderId,
				activityId: active.activityId || null,
				permissionStatus: null
			}
		}

		// Depois do dedupe: pedir permissao para um pedido ja acompanhado seria prompt a toa.
		let permission: { granted: boolean; status: PushPermissionStatus | null }

		if (options?.skipPermissionRequest) {
			const currentStatus = await this.checkPushPermission()

			permission = { granted: currentStatus === PUSH_PERMISSION_STATUS.GRANTED, status: currentStatus }
		} else {
			permission = await this.ensurePushPermission()
		}

		if (!permission.granted) {
			return {
				started: false,
				reason: START_RESULT_REASON.PERMISSION_DENIED,
				orderId,
				activityId: null,
				permissionStatus: permission.status
			}
		}

		const content = await this.getContentConfig()

		const input = {
			orderId,
			orderIdDisplayText: text(order?.orderIdDisplayText) || orderId,
			storeName: order?.storeName || content.storeName,
			status: resolveStatus(order?.status, content.presets),
			message: resolveMessage(order?.status, order?.message, content.presets),
			estimatedTime: ''
		}

		try {
			const result = await module.start(input)

			return {
				started: true,
				reason: START_RESULT_REASON.STARTED,
				orderId: result?.orderId || orderId,
				activityId: result?.activityId || null,
				permissionStatus: permission.status
			}
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao iniciar live notification', e)

			return {
				started: false,
				reason: START_RESULT_REASON.ERROR,
				orderId,
				activityId: null,
				permissionStatus: permission.status,
				errorMessage: text((e as Error)?.message || e) || 'erro desconhecido'
			}
		}
	}

	/** Atualiza uma notificacao existente. Retorna false se nao houver uma ativa para o pedido. */
	static async updateOrderStatusNotification(order: OrderNotificationInput): Promise<boolean> {
		const orderId = text(order?.orderId)
		const module = await this.getOrderStatusModule()

		if (!orderId || typeof module?.update !== 'function') {
			return false
		}

		if (!(await this.hasActiveOrderNotification(orderId))) {
			return false
		}

		const content = await this.getContentConfig()

		const input: Record<string, unknown> = {
			orderId,
			status: resolveStatus(order?.status, content.presets),
			message: resolveMessage(order?.status, order?.message, content.presets)
		}

		if (order?.estimatedTime) {
			input.estimatedTime = `${order.estimatedTime}`
		}

		try {
			await module.update(input)

			return true
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao atualizar live notification', e)

			return false
		}
	}

	static async endOrderStatusNotification(orderId?: string): Promise<boolean> {
		const resolvedOrderId = text(orderId)
		const module = await this.getOrderStatusModule()

		if (!resolvedOrderId || typeof module?.end !== 'function') {
			return false
		}

		try {
			await module.end({ orderId: resolvedOrderId })

			return true
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao encerrar live notification', e)

			return false
		}
	}

	static async endAllOrderStatusNotifications(): Promise<boolean> {
		const module = await this.getOrderStatusModule()

		if (typeof module?.endAll !== 'function') {
			return false
		}

		try {
			await module.endAll()

			return true
		} catch (e) {
			console.error('[LiveNotificationService] Falha ao encerrar todas as live notifications', e)

			return false
		}
	}
}
