import type { NexusRecord, NexusRecordInput } from './Nexus'

type ElementOf<V> = V extends readonly (infer E)[] ? E : never

export interface FieldOperators<V> {
	$eq?: V
	$ne?: V
	$in?: V[]
	$nin?: V[]
	/** Compara número com número e texto com texto (datas ISO incluídas); tipos diferentes não casam. */
	$gt?: V
	$gte?: V
	$lt?: V
	$lte?: V
	$exists?: boolean
}

/** Valor direto é igualdade; em campo array, casa quando o array contém o valor. */
export type FieldCondition<V> = V | ElementOf<V> | FieldOperators<V | ElementOf<V>>

type FieldFilter<T> = { [K in keyof T & string]?: FieldCondition<T[K]> }

/** Caminho com ponto (ex.: `'reminder.pushOptIn'`) desce em objetos aninhados. */
type PathFilter = { [path: `${string}.${string}`]: FieldCondition<unknown> }

export type Filter<T> = FieldFilter<T> &
	PathFilter & {
		$and?: Filter<T>[]
		$or?: Filter<T>[]
	}

export type Query<T> = Filter<T> | ((doc: T) => boolean)

export type SortSpec<T> = Partial<Record<(keyof T & string) | `${string}.${string}`, 1 | -1>>

export interface FindOptions<T> {
	sort?: SortSpec<T>
	skip?: number
	limit?: number
}

export interface UpdateOptions {
	/** Sem item que case, insere `patch` com os campos de igualdade do filtro. */
	upsert?: boolean
}

/** Campos que o app escreve; `id`, `createdAt` e `updatedAt` são do SDK e do Nexus. */
export type Patch<T extends NexusRecord> = Partial<NexusRecordInput<T>>

/**
 * Coleção do customer no Nexus com API no estilo do driver do Mongo. O Nexus só devolve a coleção
 * inteira, então filtro, ordenação e paginação rodam no device, a cada chamada.
 */
export interface NexusCollection<T extends NexusRecord> {
	readonly name: string
	find(query?: Query<T>, options?: FindOptions<T>): Promise<T[]>
	findOne(query?: Query<T>, options?: Pick<FindOptions<T>, 'sort'>): Promise<T | null>
	findById(id: string): Promise<T | null>
	countDocuments(query?: Query<T>): Promise<number>
	insertOne(doc: NexusRecordInput<T>): Promise<T>
	/** O PATCH do Nexus mescla as chaves de topo: um objeto aninhado no patch substitui o anterior inteiro. */
	updateOne(query: Query<T>, patch: Patch<T>, options?: UpdateOptions): Promise<T | null>
	updateById(id: string, patch: Patch<T>): Promise<T>
	updateMany(query: Query<T>, patch: Patch<T>): Promise<T[]>
	deleteOne(query: Query<T>): Promise<boolean>
	deleteById(id: string): Promise<void>
	deleteMany(query: Query<T>): Promise<number>
	/** Idempotente pela `key`: atualiza o item com a mesma key ou cria um. */
	upsert(doc: NexusRecordInput<T> & { key: string }): Promise<T>
}
