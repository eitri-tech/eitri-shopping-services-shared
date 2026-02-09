import Eitri from 'eitri-bifrost'
import Logger from './_helpers/Logger'

export interface ViaCepResponse {
	cep: string
	logradouro: string
	complemento: string
	bairro: string
	localidade: string
	uf: string
	erro?: boolean
}

export interface AddressFromCep {
	address1: string
	city: string
	province: string
	country: string
	zip: string
}

export class AddressService {
	static async getAddressFromCep(cep: string): Promise<AddressFromCep | null> {
		const cleanCep = cep.replace(/\D/g, '')

		if (cleanCep.length !== 8) {
			Logger.log('[AddressService] CEP inválido:', cep)
			return null
		}

		try {
			const response = await Eitri.http.get(`https://viacep.com.br/ws/${cleanCep}/json/`)
			const data: ViaCepResponse = response.data

			if (data.erro) {
				Logger.log('[AddressService] CEP não encontrado:', cleanCep)
				return null
			}

			Logger.log('[AddressService] Endereço encontrado:', data.localidade, data.uf)

			return {
				address1: data.logradouro || 'N/A',
				city: data.localidade,
				province: data.uf,
				country: 'BR',
				zip: cleanCep
			}
		} catch (err) {
			Logger.log('[AddressService] Erro ao buscar CEP:', err)
			return null
		}
	}
}
