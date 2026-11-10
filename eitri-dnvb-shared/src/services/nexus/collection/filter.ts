import { NexusError } from '../../../errors/NexusError'
import type { FindOptions, Query, SortSpec } from '../../../models/Collection'
import { isObject } from '../../_helpers/http'

export const valueAt = (doc: unknown, path: string): unknown =>
	path.split('.').reduce<unknown>((node, key) => (isObject(node) ? node[key] : undefined), doc)

const deepEqual = (a: unknown, b: unknown): boolean => {
	if (a === b) return true
	if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]))
	if (isObject(a) && isObject(b)) {
		const keys = Object.keys(a)
		return keys.length === Object.keys(b).length && keys.every(key => deepEqual(a[key], b[key]))
	}
	return false
}

const matchesValue = (actual: unknown, expected: unknown): boolean =>
	Array.isArray(actual) && !Array.isArray(expected)
		? actual.some(item => deepEqual(item, expected))
		: deepEqual(actual ?? null, expected ?? null)

const compare = (a: unknown, b: unknown): number | null => {
	if (typeof a === 'number' && typeof b === 'number') return a - b
	if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0
	return null
}

const isOperatorObject = (value: unknown): value is Record<string, unknown> =>
	isObject(value) && Object.keys(value).length > 0 && Object.keys(value).every(key => key.startsWith('$'))

const compareWith = (actual: unknown, expected: unknown, test: (diff: number) => boolean): boolean => {
	const values = Array.isArray(actual) ? actual : [actual]
	return values.some(value => {
		const diff = compare(value, expected)
		return diff !== null && test(diff)
	})
}

const matchOperator = (actual: unknown, operator: string, expected: unknown): boolean => {
	switch (operator) {
		case '$eq':
			return matchesValue(actual, expected)
		case '$ne':
			return !matchesValue(actual, expected)
		case '$in':
			return Array.isArray(expected) && expected.some(item => matchesValue(actual, item))
		case '$nin':
			return Array.isArray(expected) && !expected.some(item => matchesValue(actual, item))
		case '$gt':
			return compareWith(actual, expected, diff => diff > 0)
		case '$gte':
			return compareWith(actual, expected, diff => diff >= 0)
		case '$lt':
			return compareWith(actual, expected, diff => diff < 0)
		case '$lte':
			return compareWith(actual, expected, diff => diff <= 0)
		case '$exists':
			return (actual !== undefined) === (expected === true)
		default:
			throw new NexusError('INVALID_FILTER', `Operador não suportado: ${operator}`)
	}
}

const matchCondition = (actual: unknown, condition: unknown): boolean =>
	isOperatorObject(condition)
		? Object.entries(condition).every(([operator, expected]) => matchOperator(actual, operator, expected))
		: matchesValue(actual, condition)

const matchFilter = (doc: unknown, filter: Record<string, unknown>): boolean =>
	Object.entries(filter).every(([key, condition]) => {
		if (key === '$and' || key === '$or') {
			if (!Array.isArray(condition)) throw new NexusError('INVALID_FILTER', `${key} precisa ser um array`)
			const test = (item: unknown) => isObject(item) && matchFilter(doc, item)
			return key === '$and' ? condition.every(test) : condition.some(test)
		}
		if (key.startsWith('$')) throw new NexusError('INVALID_FILTER', `Operador não suportado na raiz: ${key}`)
		return matchCondition(valueAt(doc, key), condition)
	})

/** Filtro inválido lança `INVALID_FILTER`: ignorar a parte desconhecida casaria itens demais. */
export const matches = <T>(doc: T, query: Query<T> | undefined): boolean => {
	if (!query) return true
	if (typeof query === 'function') return query(doc) === true
	if (!isObject(query)) throw new NexusError('INVALID_FILTER', 'Filtro precisa ser um objeto ou uma função')
	return matchFilter(doc, query)
}

const sortDocs = <T>(docs: T[], sort: SortSpec<T>): T[] => {
	const keys = Object.entries(sort).filter((entry): entry is [string, 1 | -1] => entry[1] === 1 || entry[1] === -1)
	if (!keys.length) return docs
	return [...docs].sort((a, b) => {
		for (const [path, direction] of keys) {
			const left = valueAt(a, path)
			const right = valueAt(b, path)
			if (left === right) continue
			if (left === undefined || left === null) return 1
			if (right === undefined || right === null) return -1
			const diff = compare(left, right)
			if (diff) return diff * direction
		}
		return 0
	})
}

export const applyFind = <T>(docs: T[], query?: Query<T>, options?: FindOptions<T>): T[] => {
	const filtered = docs.filter(doc => matches(doc, query))
	const sorted = options?.sort ? sortDocs(filtered, options.sort) : filtered
	const skip = Math.max(0, Math.floor(options?.skip ?? 0))
	const limit = options?.limit && options.limit > 0 ? Math.floor(options.limit) : undefined
	return sorted.slice(skip, limit === undefined ? undefined : skip + limit)
}

/** Campos de igualdade simples do filtro, que entram no item criado por `updateOne(..., { upsert: true })`. */
export const equalityFields = <T>(query: Query<T>): Record<string, unknown> => {
	if (typeof query === 'function' || !isObject(query)) {
		throw new NexusError('INVALID_FILTER', 'upsert precisa de um filtro em objeto')
	}
	return Object.fromEntries(
		Object.entries(query).filter(
			([key, value]) => !key.startsWith('$') && !key.includes('.') && !isOperatorObject(value)
		)
	)
}
