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

export type PushPermission = 'granted' | 'denied' | 'unknown'

/** Lembrete de push do customer, em `/customers/me/reminders`. */
export interface NexusReminder {
	id: string
	/** Slug da rotina no CMS: escolhe a mensagem de push e vai no deeplink. `null` é lembrete genérico. */
	routineKey: string | null
	/** Id do item da coleção `routines` a que o lembrete pertence. */
	routineItemId: string | null
	/** HH:mm no fuso da marca. */
	time: string
	/** `false` silencia: o lembrete fica guardado, mas não sai push. */
	enabled: boolean
	/** `denied` tira o lembrete da agenda; `unknown` agenda normalmente. */
	pushPermission: PushPermission
	/** Instante ISO a partir do qual lembrar; `null` é desde já. */
	startsAt: string | null
	/** Instante ISO até quando lembrar, exclusivo; `null` é sem fim. */
	endsAt: string | null
	activatedAt: string | null
	createdAt: string
	updatedAt: string
}

export interface NexusReminderInput {
	routineKey?: string | null
	routineItemId?: string | null
	time: string
	enabled?: boolean
	pushPermission?: PushPermission
	startsAt?: string | null
	endsAt?: string | null
}

/** A rotina do lembrete não muda, e `null` mantém o valor: o PATCH não consegue limpar `endsAt`. */
export type NexusReminderPatch = Partial<Pick<NexusReminderInput, 'time' | 'enabled' | 'pushPermission' | 'startsAt' | 'endsAt'>>

/** @deprecated Use `Nexus.reminders`. Enquanto o item declarar `reminder`, o Nexus recria o lembrete. */
export interface RoutineReminderPref {
	/** HH:MM */
	time: string
	pushOptIn: boolean
	permission?: 'granted' | 'denied'
	activatedAt?: string
}

/**
 * Item da coleção `routines`. O lembrete de push fica em `Nexus.reminders`, ligado ao item por
 * `routineItemId`. Campos próprios do app entram estendendo esta interface e lendo com
 * `collection<MinhaRotina>('routines')`.
 */
export interface RoutineRecord extends NexusRecord {
	routineSlug: string
	status: RoutineStatus
	/** YYYY-MM-DD ou instante ISO. */
	startedAt: string
	/** `null` = uso contínuo. Grave `null` em vez de omitir: o upsert faz PATCH e manteria o prazo antigo. */
	durationDays: number | null
	/**
	 * @deprecated Use `Nexus.reminders`. Não grave: enquanto o item declarar `reminder` com a rotina
	 * ativa, o Nexus recria o lembrete a cada hora, inclusive depois de um `Nexus.reminders.remove`.
	 * `null` limpa o de itens antigos: o upsert mescla as chaves de topo e manteria o anterior.
	 */
	reminder?: RoutineReminderPref | null
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
