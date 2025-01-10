import GAService from './tracking/GAService'
import ClarityService from './tracking/ClarityService'

export default class Tracking {
	static ga = GAService
	static clarity = ClarityService
}
