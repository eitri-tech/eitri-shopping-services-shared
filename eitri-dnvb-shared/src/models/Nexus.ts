import type { Open } from './Cms'

export interface NexusSession {
	installationId: string
	token: string
	applicationId: string
	registeredAt: string
}

export interface NexusCustomer {
	customerId: string
	applicationId: string
	externalCustomerId: string | null
	data: Record<string, unknown>
}

export interface NexusRecord {
	/** Gerado pelo Nexus no POST e imutável. */
	id: string
	/** Chave natural definida pelo app; é por ela que o `upsert` acha o item. */
	key?: string
	createdAt: string
	updatedAt: string
	/** Versão do formato do item, controlada pelo app. */
	v?: number
	/** Eitri-app que gravou o item. */
	source?: string
}

export type NexusRecordInput<T extends NexusRecord> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

export type RoutineStatus = Open<'active' | 'replaced' | 'finished'>
export type RoutineOrigin = Open<'quiz' | 'product'>

/** O agendador de push do Nexus lê `time`, `pushOptIn` e `permission` (`denied` não agenda). */
export interface RoutineReminderPref {
	/** HH:MM */
	time: string
	pushOptIn: boolean
	permission?: 'granted' | 'denied'
	activatedAt?: string
}

/**
 * Item da coleção `routines`: o Nexus agenda um push por item com `status: 'active'` e `reminder`
 * ligado, de `startedAt` até `startedAt + durationDays`. Campos próprios do app entram estendendo
 * esta interface e lendo com `collection<MinhaRotina>('routines')`.
 */
export interface RoutineRecord extends NexusRecord {
	routineSlug: string
	status: RoutineStatus
	/** YYYY-MM-DD ou instante ISO. */
	startedAt: string
	/** `null` = uso contínuo. Grave `null` em vez de omitir: o upsert faz PATCH e manteria o prazo antigo. */
	durationDays: number | null
	reminder?: RoutineReminderPref
	origin?: RoutineOrigin
	productId?: string
	quizSlug?: string
	quizResponseId?: string
	orderId?: string
}

export interface NexusCustomerCollections {
	routines: RoutineRecord
}

export type NexusCollectionName = keyof NexusCustomerCollections
