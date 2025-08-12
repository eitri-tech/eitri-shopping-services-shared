export type ProductInput = {
	slug: string
	identifier: {
		field: string
		value: string
	}[]
	regionId: boolean
	salesChannel: number
}
