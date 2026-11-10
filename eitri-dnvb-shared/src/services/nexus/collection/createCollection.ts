import { NexusError } from '../../../errors/NexusError'
import type { NexusCollection, Patch, Query } from '../../../models/Collection'
import type { NexusRecord, NexusRecordInput } from '../../../models/Nexus'
import { isObject } from '../../_helpers/http'
import NexusCaller from '../NexusCaller'
import { applyFind, equalityFields } from './filter'

const COLLECTION_NAME = /^[A-Za-z0-9_-]{1,64}$/

const isRecord = <T extends NexusRecord>(item: unknown): item is T =>
	isObject(item) && typeof item.id === 'string' && !!item.id

const toRecord = <T extends NexusRecord>(raw: unknown, path: string): T => {
	if (!isRecord<T>(raw)) throw new NexusError('INVALID_PAYLOAD', `Item sem id em ${path}`)
	return raw
}

/** O Nexus responde 400 com `id` no corpo; `createdAt` no PATCH sobrescreveria a data de criação. */
const writableFields = (fields: Record<string, any>): Record<string, any> => {
	const { id, createdAt, updatedAt, ...rest } = fields
	return rest
}

/**
 * Escritas da mesma coleção passam por uma fila: as que leem antes de gravar (upsert, updateOne,
 * deleteMany) duplicariam ou perderiam itens se rodassem em paralelo.
 */
const queues = new Map<string, Promise<unknown>>()

const enqueue = <R>(name: string, task: () => Promise<R>): Promise<R> => {
	const next = (queues.get(name) ?? Promise.resolve()).catch(() => undefined).then(task)
	queues.set(name, next)
	return next
}

export const createCollection = <T extends NexusRecord>(name: string): NexusCollection<T> => {
	if (typeof name !== 'string' || !COLLECTION_NAME.test(name)) {
		throw new NexusError('INVALID_COLLECTION', `Nome de coleção inválido: "${name}"`)
	}
	const base = `/customers/me/collections/${encodeURIComponent(name)}`
	const itemPath = (id: string) => {
		if (typeof id !== 'string' || !id) throw new NexusError('NOT_FOUND', `Item sem id na coleção "${name}"`)
		return `${base}/${encodeURIComponent(id)}`
	}

	const all = async (): Promise<T[]> => {
		const raw = await NexusCaller.request('get', base)
		return Array.isArray(raw) ? raw.filter((item): item is T => isRecord<T>(item)) : []
	}

	const insert = async (doc: NexusRecordInput<T> | Record<string, unknown>): Promise<T> => {
		if (!isObject(doc)) throw new NexusError('INVALID_PAYLOAD', `Documento inválido na coleção "${name}"`)
		const now = new Date().toISOString()
		return toRecord<T>(await NexusCaller.request('post', base, { ...writableFields(doc), createdAt: now, updatedAt: now }), base)
	}

	const patchById = async (id: string, patch: Patch<T>): Promise<T> => {
		if (!isObject(patch)) throw new NexusError('INVALID_PAYLOAD', `Patch inválido na coleção "${name}"`)
		const path = itemPath(id)
		const body = { ...writableFields(patch), updatedAt: new Date().toISOString() }
		return toRecord<T>(await NexusCaller.request('patch', path, body), path)
	}

	const removeById = async (id: string): Promise<void> => {
		await NexusCaller.request('delete', itemPath(id))
	}

	return {
		name,
		async find(query, options) {
			return applyFind(await all(), query, options)
		},
		async findOne(query, options) {
			return applyFind(await all(), query, { sort: options?.sort, limit: 1 })[0] ?? null
		},
		async findById(id) {
			return (await all()).find(doc => doc.id === id) ?? null
		},
		async countDocuments(query) {
			return applyFind(await all(), query).length
		},
		insertOne(doc) {
			return enqueue(name, () => insert(doc))
		},
		updateOne(query: Query<T>, patch: Patch<T>, options) {
			return enqueue(name, async () => {
				const [existing] = applyFind(await all(), query, { limit: 1 })
				if (existing) return patchById(existing.id, patch)
				return options?.upsert ? insert({ ...equalityFields(query), ...patch }) : null
			})
		},
		updateById(id, patch) {
			return enqueue(name, () => patchById(id, patch))
		},
		updateMany(query, patch) {
			return enqueue(name, async () => {
				const updated: T[] = []
				for (const doc of applyFind(await all(), query)) updated.push(await patchById(doc.id, patch))
				return updated
			})
		},
		deleteOne(query) {
			return enqueue(name, async () => {
				const [existing] = applyFind(await all(), query, { limit: 1 })
				if (!existing) return false
				await removeById(existing.id)
				return true
			})
		},
		deleteById(id) {
			return enqueue(name, () => removeById(id))
		},
		deleteMany(query) {
			return enqueue(name, async () => {
				const docs = applyFind(await all(), query)
				for (const doc of docs) await removeById(doc.id)
				return docs.length
			})
		},
		upsert(doc) {
			if (!isObject(doc) || typeof doc.key !== 'string' || !doc.key) {
				return Promise.reject(new NexusError('INVALID_PAYLOAD', `upsert sem key na coleção "${name}"`))
			}
			return enqueue(name, async () => {
				const existing = (await all()).find(item => item.key === doc.key)
				return existing ? patchById(existing.id, doc as Patch<T>) : insert(doc)
			})
		}
	}
}
