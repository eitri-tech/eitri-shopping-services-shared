import { NexusError } from '../../errors/NexusError'
import type {
	NexusReminder,
	NexusReminderInput,
	NexusReminderPatch,
	PushPermission
} from '../../models/Nexus'
import { isObject } from '../_helpers/http'
import { timeOfDay } from '../journeys/reminderTime'
import NexusCaller from './NexusCaller'

const REMINDERS = '/customers/me/reminders'
const PERMISSIONS: PushPermission[] = ['granted', 'denied', 'unknown']

const stringOrNull = (value: unknown): string | null => (typeof value === 'string' && value ? value : null)

const normalizeReminder = (raw: unknown): NexusReminder | null => {
	if (!isObject(raw) || typeof raw.id !== 'string' || typeof raw.time !== 'string') return null
	return {
		id: raw.id,
		routineKey: stringOrNull(raw.routineKey),
		routineItemId: stringOrNull(raw.routineItemId),
		time: raw.time,
		enabled: raw.enabled !== false,
		pushPermission: PERMISSIONS.includes(raw.pushPermission) ? raw.pushPermission : 'unknown',
		startsAt: stringOrNull(raw.startsAt),
		endsAt: stringOrNull(raw.endsAt),
		activatedAt: stringOrNull(raw.activatedAt),
		createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
		updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : ''
	}
}

const requireReminder = (raw: unknown, path: string): NexusReminder => {
	const reminder = normalizeReminder(raw)
	if (!reminder) throw new NexusError('INVALID_PAYLOAD', `Lembrete inválido em ${path}`)
	return reminder
}

const timeOrThrow = (time: unknown): string => {
	const normalized = timeOfDay(time)
	if (!normalized) throw new NexusError('INVALID_PAYLOAD', `time precisa ser HH:mm, veio ${String(time)}`)
	return normalized
}

/** O Nexus trata ausente e `null` igual no PATCH; mandar só o que tem valor deixa o corpo explícito. */
const definedFields = <T extends Record<string, unknown>>(fields: T): Partial<T> =>
	Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== null)) as Partial<T>

const isConflict = (e: unknown): boolean => e instanceof NexusError && e.status === 409

export default class ReminderService {
	/** Em ordem de criação. É o estado real (horário, silenciado): prefira a um cache local. */
	static async list(): Promise<NexusReminder[]> {
		const raw = await NexusCaller.request('get', REMINDERS)
		if (!Array.isArray(raw)) throw new NexusError('INVALID_PAYLOAD', `${REMINDERS} não devolveu uma lista`)
		return raw.map(normalizeReminder).filter((reminder): reminder is NexusReminder => reminder !== null)
	}

	static async findByRoutine(routineKey: string): Promise<NexusReminder | null> {
		const key = typeof routineKey === 'string' ? routineKey.trim() : ''
		if (!key) return null
		return (await ReminderService.list()).find(reminder => reminder.routineKey === key) ?? null
	}

	/** `CONFLICT` quando o customer já tem lembrete para a `routineKey` ou chegou a 50 lembretes. */
	static async create(input: NexusReminderInput): Promise<NexusReminder> {
		if (!isObject(input)) throw new NexusError('INVALID_PAYLOAD', 'input precisa ser um objeto')
		const body = definedFields({ ...input, time: timeOrThrow(input.time) })
		try {
			return requireReminder(await NexusCaller.request('post', REMINDERS, body), REMINDERS)
		} catch (e) {
			if (!isConflict(e)) throw e
			throw new NexusError('CONFLICT', 'Já existe lembrete para esta rotina, ou o customer chegou ao limite', 409)
		}
	}

	static async update(id: string, patch: NexusReminderPatch): Promise<NexusReminder> {
		if (!id) throw new NexusError('INVALID_PAYLOAD', 'id do lembrete vazio')
		if (!isObject(patch)) throw new NexusError('INVALID_PAYLOAD', 'patch precisa ser um objeto')
		const { time, enabled, pushPermission, startsAt, endsAt } = patch
		const body = definedFields({
			time: time === undefined ? undefined : timeOrThrow(time),
			enabled,
			pushPermission,
			startsAt,
			endsAt
		})
		const path = `${REMINDERS}/${encodeURIComponent(id)}`
		return requireReminder(await NexusCaller.request('patch', path, body), path)
	}

	/** `NOT_FOUND` quando o lembrete não existe ou é de outro customer. */
	static async remove(id: string): Promise<void> {
		if (!id) throw new NexusError('INVALID_PAYLOAD', 'id do lembrete vazio')
		await NexusCaller.request('delete', `${REMINDERS}/${encodeURIComponent(id)}`)
	}

	/**
	 * Cria o lembrete da rotina ou atualiza o que já existe; `input` é o estado completo, então campo
	 * ausente vira o padrão. Como o PATCH não troca o item nem limpa o período, nesses casos o lembrete
	 * antigo é apagado e criado de novo.
	 */
	static async upsertForRoutine(input: NexusReminderInput & { routineKey: string }): Promise<NexusReminder> {
		try {
			return await ReminderService.create(input)
		} catch (e) {
			if (!isConflict(e)) throw e
		}

		const existing = await ReminderService.findByRoutine(input.routineKey)
		if (!existing) throw new NexusError('LIMIT_REACHED', 'O customer chegou ao limite de lembretes', 409)

		const itemChanged = (input.routineItemId ?? null) !== existing.routineItemId
		const periodCleared = (!input.startsAt && existing.startsAt !== null) || (!input.endsAt && existing.endsAt !== null)
		if (itemChanged || periodCleared) {
			await ReminderService.remove(existing.id)
			return ReminderService.create(input)
		}

		return ReminderService.update(existing.id, {
			time: input.time,
			enabled: input.enabled ?? true,
			pushPermission: input.pushPermission,
			startsAt: input.startsAt,
			endsAt: input.endsAt
		})
	}
}
