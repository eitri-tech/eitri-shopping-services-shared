export interface RemoteConfig {
	ecommerceProvider: string
	providerInfo: ProviderInfo
	appConfigs: AppConfigs
	storePreferences: StorePreferences
	searchOptions: SearchOptions
	eitriConfig: EitriConfig
	verbose: boolean
	gaVerbose: boolean
}

export interface ProviderInfo {
	account: string
	faststore: string
	vtexCmsUrl: string
	host: string
}

export interface AppConfigs {
	clarityId: string
	autoTriggerGAEvents: boolean
	statusBarTextColor: string
	headerLogo: string
	headerBackgroundColor: string
	headerContentColor: string
	productCard: ProductCard
}

export interface ProductCard {
	style: string
	showListPrice: boolean
	buyGoesToPDP: boolean
}

export interface StorePreferences {
	displayCompanyName: string
	currencyCode: string
	locale: string
	segments: Segments
	marketingTag: string
	androidMarketingTag: string
	iosMarketingTag: string
	salesChannel: string
}

export interface Segments {
	utm_campaign: string | null
	utm_source: string
	utmi_campaign: string | null
	countryCode: string
}

export interface SearchOptions {
	legacySearch: boolean
}

export interface EitriConfig {
	mainApp: string
	bottomNavItems: BottomNavItem[]
}

export interface BottomNavItem {
	slug: string
	initParams: InitParams
}

export interface InitParams {
	tabIndex: number
	route?: string
	landingPageName?: string
	pageTitle?: string
}

/**
 * Tipo genérico para configs parciais
 */
export type PartialRemoteConfig = Partial<RemoteConfig>
