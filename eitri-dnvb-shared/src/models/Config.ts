export interface DnvbConfig {
	cmsUrl: string
	nexusUrl: string
	/** Sem valor, vem de `window.__eitriAppConf.applicationId`. */
	applicationId?: string
}

export type DnvbConfigInput = Partial<DnvbConfig>
