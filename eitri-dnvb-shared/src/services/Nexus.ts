import CustomerService from './nexus/CustomerService'
import NexusDb from './nexus/NexusDb'
import NexusSession from './nexus/NexusSession'
import TrackingService from './nexus/TrackingService'

export default class Nexus {
	static session = NexusSession
	static customer = CustomerService
	static db = NexusDb
	static tracking = TrackingService
}
