export const facetsReturn = `{
	specificationFilters {
		name
		facets {
			quantity
			name
			link
			linkEncoded
			map
			value
			selected
		}
	}
	priceRanges {
		quantity
		name
		link
		linkEncoded
		map
		value
		selected
		slug
	}
	queryArgs {
		map
		query
		selectedFacets {
			key
			value
		}
	}
	facets {
		name
		values {
			id
			quantity
			name
			key
			value
			selected
			range {
				from
				to
			}
			link
			linkEncoded
			href
		}
		type
		hidden
		quantity
	}
	sampling
	breadcrumb {
		name
		href
	}
}`
