import Vtex from './../services/Vtex'
import App from '../services/App'
import { jest } from '@jest/globals'
import Eitri from 'eitri-bifrost'
describe('CalcService', () => {
	test('addition', async () => {
		// jest.spyOn(Eitri.sharedStorage, 'getItem').mockResolvedValueOnce('{}')
		await App.tryAutoConfigure()
		const result = await Vtex.customer.sendAccessKeyByEmail('wagnerfq@gmail.com')
		// const result = CalcService.addition(5, 15);
		// console.log("result", result);
		expect(result).toBe(20)
	})
})
