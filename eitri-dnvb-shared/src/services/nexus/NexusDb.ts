import type { NexusCollection } from '../../models/Collection'
import type { NexusCollectionName, NexusCustomerCollections, NexusRecord } from '../../models/Nexus'
import { createCollection } from './collection/createCollection'

/**
 * Coleções do customer atual. Nome `[A-Za-z0-9_-]{1,64}`, item até 32 KB e até 50 coleções por
 * aplicação (acima disso, `LIMIT_REACHED`).
 */
export default class NexusDb {
	static collection<K extends NexusCollectionName>(name: K): NexusCollection<NexusCustomerCollections[K]>
	static collection<T extends NexusRecord>(name: string): NexusCollection<T>
	static collection(name: string): NexusCollection<NexusRecord> {
		return createCollection(name)
	}
}
