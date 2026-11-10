export const httpStatusOf = (e: unknown): number | undefined => {
	const error = e as { response?: { status?: unknown }; status?: unknown } | null
	const status = error?.response?.status ?? error?.status
	return typeof status === 'number' ? status : undefined
}

export const isObject = (value: unknown): value is Record<string, any> =>
	!!value && typeof value === 'object' && !Array.isArray(value)
