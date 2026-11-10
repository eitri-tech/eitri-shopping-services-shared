import { DnvbConfig, DnvbConfigInput } from '../../models/Config'

const DEFAULTS: DnvbConfig = {
	cmsUrl: 'https://api.eitri.tech/eitri-dnvb-api/api',
	nexusUrl: 'https://api.eitri.tech/eitri-nexus'
}

let current: DnvbConfig = { ...DEFAULTS }

const nonEmpty = (value: unknown): string | undefined =>
	typeof value === 'string' && value.trim() ? value.trim().replace(/\/+$/, '') : undefined

export const getConfig = (): DnvbConfig => current

export const setConfig = (patch: DnvbConfigInput | null | undefined): DnvbConfig => {
	const next: DnvbConfig = { ...current }
	const cmsUrl = nonEmpty(patch?.cmsUrl)
	const nexusUrl = nonEmpty(patch?.nexusUrl)
	const applicationId = nonEmpty(patch?.applicationId)
	if (cmsUrl) next.cmsUrl = cmsUrl
	if (nexusUrl) next.nexusUrl = nexusUrl
	if (applicationId) next.applicationId = applicationId
	current = next
	return current
}

export const resetConfig = (): void => {
	current = { ...DEFAULTS }
}

export const getApplicationId = (): string | null => {
	if (current.applicationId) return current.applicationId
	const appId = (globalThis as any)?.window?.__eitriAppConf?.applicationId
	return typeof appId === 'string' && appId ? appId : null
}
