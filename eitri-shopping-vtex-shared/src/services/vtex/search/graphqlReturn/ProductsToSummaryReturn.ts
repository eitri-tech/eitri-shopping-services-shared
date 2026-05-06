export const productsToSummaryReturn = `{
	brand
	brandId
	categoryId
	categoryTree {
		name
	}
	description
	productClusters {
		id
		name
	}
	clusterHighlights {
		id
		name
	}
	items {
		itemId
		name
		nameComplete
		complementName
		ean
		referenceId {
			Key
			Value
		}
		measurementUnit
		unitMultiplier
		images {
			imageId
			imageLabel
			imageUrl
			imageText
		}
		sellers {
			sellerId
			sellerName
			sellerDefault
			commertialOffer {
				Installments {
					Value
					InterestRate
					TotalValuePlusInterestRate
					NumberOfInstallments
					PaymentSystemName
					Name
				}
				Price
				ListPrice
				PriceWithoutDiscount
				spotPrice
				RewardValue
				PriceValidUntil
				AvailableQuantity
				Tax
				taxPercentage
				discountHighlights {
					name
				}
				teasers {
					name
					conditions {
						minimumQuantity
						parameters {
							name
							value
						}
					}
					effects {
						parameters {
							name
							value
						}
					}
				}
			}
		}
		variations {
			name
			values
		}
	}
	link
	linkText
	priceRange {
		sellingPrice {
			highPrice
			lowPrice
		}
		listPrice {
			highPrice
			lowPrice
		}
	}
	productId
	productName
	productReference
	properties {
		name
		values
	}
	releaseDate
	skuSpecifications {
		field {
			originalName
			name
		}
		values {
			originalName
			name
		}
	}
	specificationGroups {
		name
		originalName
		specifications {
			name
			originalName
			values
		}
	}
}`
