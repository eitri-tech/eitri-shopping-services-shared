export type PushPermissionStatus = 'GRANTED' | 'DENIED' | 'BLOCKED'

export type StartResultReason =
	| 'started'
	| 'already_active'
	| 'unsupported'
	| 'missing_order_id'
	| 'permission_denied'
	| 'feature_disabled'
	| 'error'

/** `icon` e um SF Symbol; `progress` vai de 0.0 a 1.0. */
export interface OrderStatusPreset {
	displayName: string
	icon: string
	progress: number
	message: string
}

export type OrderStatusPresets = Record<string, OrderStatusPreset>

export interface OrderStatusInput {
	displayName?: string
	icon?: string
	progress?: number
}

export interface OrderNotificationInput {
	orderId: string
	orderIdDisplayText?: string
	storeName?: string
	/** chave dos presets ou objeto proprio */
	status?: string | OrderStatusInput
	message?: string
	estimatedTime?: string | number
}

export interface StartOptions {
	/** so checa a permissao, sem abrir o prompt nativo */
	skipPermissionRequest?: boolean
	origin?: string
	/** params extra (snake_case) anexados ao evento de desfecho */
	diagnostics?: Record<string, unknown>
	/** checado contra o toggle do remote config; sem toggle configurado, ignorado */
	userEmail?: string
}

export interface StartResult {
	started: boolean
	reason: StartResultReason
	orderId: string
	activityId: string | null
	permissionStatus: PushPermissionStatus | null
	errorMessage?: string
}

export interface PermissionResult {
	granted: boolean
	status: PushPermissionStatus | null
	requested: boolean
}

export interface ActiveOrderNotification {
	orderId?: string
	activityId?: string
	[key: string]: unknown
}

export interface TrackParams {
	orderId?: string
	origin?: string
	extra?: Record<string, unknown>
}

export interface SkipParams {
	skipReason: string
	orderId?: string
	origin?: string
	userEmail?: string
	diagnostics?: Record<string, unknown>
}

export interface LogPayload {
	name: string
	message: string
	method: string
	data: Record<string, unknown>
}

/** Destino dos logs de diagnostico (Datadog, console, o que o app usar). */
export interface NotificationLogger {
	error?: (payload: LogPayload) => void
	info?: (payload: LogPayload) => void
}

export type NotificationTracker = (eventName: string, params: Record<string, unknown>) => void | Promise<void>

export interface LiveNotificationServiceConfig {
	storeName: string
	presets: OrderStatusPresets
	/** chave em remote config com a lista de e-mails liberados; vazio desliga o toggle */
	allowedEmailsConfigKey: string
	/** chave em remote config que sobrescreve storeName/presets sem publicar versao nova */
	contentConfigKey: string
	trackers: NotificationTracker[]
	logger: NotificationLogger | null
}

export interface OrderStatusModule {
	isSupported?: () => Promise<boolean>
	start?: (input: Record<string, unknown>) => Promise<{ orderId?: string; activityId?: string } | void>
	update?: (input: Record<string, unknown>) => Promise<unknown>
	end?: (input: { orderId: string }) => Promise<unknown>
	endAll?: () => Promise<unknown>
	getActiveNotifications?: () => Promise<unknown>
}

export interface ContentConfig {
	storeName: string
	presets: OrderStatusPresets
}

export interface RemoteContentConfig {
	storeName?: unknown
	statuses?: unknown
}
