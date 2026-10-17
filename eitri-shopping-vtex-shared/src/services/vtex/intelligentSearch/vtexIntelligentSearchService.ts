import VtexCaller from '../_helpers/_vtexCaller'
import objectToQueryString from '../_helpers/objectToQueryString'
import getSalesChannel from '../_helpers/getSalesChannel'
import VtexCustomerService from '../customer/vtexCustomerService'
import {
	FacetsOptions,
	FacetsPath,
	GetProductOptions,
	IntelligentSearchRequestConfig,
	IntelligentSearchBanners,
	IntelligentSearchCorrection,
	IntelligentSearchFacetsResult,
	IntelligentSearchLocale,
	IntelligentSearchPickupPointAvailability,
	IntelligentSearchProduct,
	IntelligentSearchProductSearchResult,
	IntelligentSearchSuggestions,
	PickupPointAvailabilityOptions,
	ProductIdentifierField,
	ProductSearchOptions
} from './types/IntelligentSearch'

const BASE_PATH = 'api/intelligent-search/v1'

export default class VtexIntelligentSearchService {
	// Removes null/undefined/empty values before serializing to a query string.
	static _buildQueryString = (params: Record<string, any> = {}): string => {
		const clean = Object.entries(params).reduce((acc, [key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				acc[key] = value
			}
			return acc
		}, {} as Record<string, any>)
		return objectToQueryString(clean)
	}

	// Normalizes the facets path segment. Accepts a raw path string
	// ("category-1/clothing") or a list of { key, value } pairs.
	static _normalizeFacets = (facets: FacetsPath = ''): string => {
		if (Array.isArray(facets)) {
			return facets
				.filter(facet => facet?.key && facet?.value != null && facet.value !== '')
				.map(facet => `${facet.key}/${facet.value}`)
				.join('/')
		}
		return facets.replace(/^\/+|\/+$/g, '')
	}

	// Reads the user's stored region and maps it to Intelligent Search regionalization params.
	static _getRegionParams = async (): Promise<Record<string, any>> => {
		try {
			const region = await VtexCustomerService.getStoredRegionData()
			if (!region) return {}
			return {
				regionId: region.regionId,
				country: region.country,
				'zip-code': region.postalCode
			}
		} catch (error) {
			return {}
		}
	}

	// Reads the user's stored UTM params and maps them to the simulation params
	// forwarded by Intelligent Search (utmSource, utmCampaign).
	static _getUtmParams = async (): Promise<Record<string, any>> => {
		try {
			const utm: any = await VtexCustomerService.getUtmParams()
			if (!utm) return {}
			return {
				utmSource: utm.utm_source,
				utmCampaign: utm.utm_campaign
			}
		} catch (error) {
			return {}
		}
	}

	// Builds the base store-context params shared by product/facets endpoints:
	// sales channel (trade policy) + user region.
	static _getBaseDefaults = async (
		config: IntelligentSearchRequestConfig = {}
	): Promise<Record<string, any>> => {
		const { regionalization = true } = config
		const [salesChannel, region] = await Promise.all([
			getSalesChannel(),
			regionalization ? VtexIntelligentSearchService._getRegionParams() : Promise.resolve({})
		])
		return { sc: salesChannel, ...region }
	}

	// Builds the defaults for endpoints that also forward params to the pricing
	// and availability simulation (base context + UTM).
	static _getSimulationDefaults = async (
		config: IntelligentSearchRequestConfig = {}
	): Promise<Record<string, any>> => {
		const [base, utm] = await Promise.all([
			VtexIntelligentSearchService._getBaseDefaults(config),
			VtexIntelligentSearchService._getUtmParams()
		])
		return { ...base, ...utm }
	}

	static _appendQuery = (path: string, queryString: string): string =>
		queryString ? `${path}?${queryString}` : path

	// ===== Autocomplete =====

	// Lists the 10 most searched terms in the past 14 days.
	static async topSearches(locale?: IntelligentSearchLocale): Promise<IntelligentSearchSuggestions> {
		const queryString = VtexIntelligentSearchService._buildQueryString({ locale })
		const url = VtexIntelligentSearchService._appendQuery(`${BASE_PATH}/top-searches`, queryString)
		const result = await VtexCaller.get(url)
		return result?.data
	}

	// Lists suggested terms and attributes similar to the search term.
	static async autocompleteSuggestions(
		query: string,
		locale?: IntelligentSearchLocale
	): Promise<IntelligentSearchSuggestions> {
		const queryString = VtexIntelligentSearchService._buildQueryString({ query, locale })
		const url = VtexIntelligentSearchService._appendQuery(
			`${BASE_PATH}/autocomplete-suggestions`,
			queryString
		)
		const result = await VtexCaller.get(url)
		return result?.data
	}

	// Lists suggested terms similar to the search term.
	static async searchSuggestions(
		query: string,
		locale?: IntelligentSearchLocale
	): Promise<IntelligentSearchSuggestions> {
		const queryString = VtexIntelligentSearchService._buildQueryString({ query, locale })
		const url = VtexIntelligentSearchService._appendQuery(`${BASE_PATH}/search-suggestions`, queryString)
		const result = await VtexCaller.get(url)
		return result?.data
	}

	// ===== Product list page =====

	// Tries to correct a misspelled search term.
	static async correctionSearch(
		query: string,
		locale?: IntelligentSearchLocale
	): Promise<IntelligentSearchCorrection> {
		const queryString = VtexIntelligentSearchService._buildQueryString({ query, locale })
		const url = VtexIntelligentSearchService._appendQuery(`${BASE_PATH}/correction-search`, queryString)
		const result = await VtexCaller.get(url)
		return result?.data
	}

	// Lists the banners registered for a given query/facets.
	static async banners(
		facets: FacetsPath = '',
		options: ProductSearchOptions = {}
	): Promise<IntelligentSearchBanners> {
		const path = VtexIntelligentSearchService._normalizeFacets(facets)
		const queryString = VtexIntelligentSearchService._buildQueryString(options)
		const url = VtexIntelligentSearchService._appendQuery(`${BASE_PATH}/banners/${path}`, queryString)
		const result = await VtexCaller.get(url)
		return result?.data
	}

	// Lists the active products for a given query/facets.
	static async productSearch(
		facets: FacetsPath = '',
		options: ProductSearchOptions = {},
		config: IntelligentSearchRequestConfig = {}
	): Promise<IntelligentSearchProductSearchResult> {
		const defaults = await VtexIntelligentSearchService._getSimulationDefaults(config)
		const path = VtexIntelligentSearchService._normalizeFacets(facets)
		const queryString = VtexIntelligentSearchService._buildQueryString({ ...defaults, ...options })
		const url = VtexIntelligentSearchService._appendQuery(
			`${BASE_PATH}/product-search/${path}`,
			queryString
		)
		const result = await VtexCaller.get(url)
		return result?.data
	}

	// Lists the possible facets (filters) for a given query/facets.
	static async facets(
		facets: FacetsPath = '',
		options: FacetsOptions = {},
		config: IntelligentSearchRequestConfig = {}
	): Promise<IntelligentSearchFacetsResult> {
		const defaults = await VtexIntelligentSearchService._getBaseDefaults(config)
		const path = VtexIntelligentSearchService._normalizeFacets(facets)
		const queryString = VtexIntelligentSearchService._buildQueryString({ ...defaults, ...options })
		const url = VtexIntelligentSearchService._appendQuery(`${BASE_PATH}/facets/${path}`, queryString)
		const result = await VtexCaller.get(url)
		return result?.data
	}

	// ===== Product details page (PDP) =====

	// Retrieves a single product by a known identifier (id, slug, ean, sku, reference).
	static async getProduct(
		value: string,
		field: ProductIdentifierField = 'id',
		options: GetProductOptions = {},
		config: IntelligentSearchRequestConfig = {}
	): Promise<IntelligentSearchProduct> {
		const defaults = await VtexIntelligentSearchService._getSimulationDefaults(config)
		const queryString = VtexIntelligentSearchService._buildQueryString({
			...defaults,
			value,
			field,
			...options
		})
		const url = VtexIntelligentSearchService._appendQuery(`${BASE_PATH}/products`, queryString)
		const result = await VtexCaller.get(url)
		return result?.data
	}

	// ===== Delivery Promise =====

	// Lists available pickup points sorted by distance for Delivery Promise.
	static async pickupPointAvailability(
		facets: FacetsPath = '',
		options: PickupPointAvailabilityOptions = {},
		config: IntelligentSearchRequestConfig = {}
	): Promise<IntelligentSearchPickupPointAvailability> {
		const defaults = await VtexIntelligentSearchService._getBaseDefaults(config)
		const path = VtexIntelligentSearchService._normalizeFacets(facets)
		const queryString = VtexIntelligentSearchService._buildQueryString({ ...defaults, ...options })
		const url = VtexIntelligentSearchService._appendQuery(
			`api/intelligent-search/v0/pickup-point-availability/${path}`,
			queryString
		)
		const result = await VtexCaller.get(url)
		return result?.data
	}
}
