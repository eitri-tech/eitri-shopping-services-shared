import Vtex from './../services/Vtex'
import { jest } from '@jest/globals'
import Eitri from 'eitri-bifrost'
describe('CalcService', () => {
	test('addition', async () => {
		jest.spyOn(Eitri.sharedStorage, 'getItem').mockResolvedValueOnce('{}')

		const result = await Vtex.customer.getCustomerToken()
		// const result = CalcService.addition(5, 15);
		// console.log("result", result);
		expect(result).toBe(20)
	})
})
