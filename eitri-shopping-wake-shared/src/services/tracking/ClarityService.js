import Eitri from 'eitri-bifrost'

export default class ClarityService {
	static async init(projectId) {
		if (!projectId) {
			return
		}
		Eitri.clarity
			.init(projectId)
			.then(() => {
				console.log('Clarity initialized')
			})
			.catch(error => {
				console.error('Error initializing Clarity', error)
			})
	}
}
