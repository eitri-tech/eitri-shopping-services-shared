export const productReturn = `{
	brand, 
	brandId,
	categoryId,
	categoryTree {
		id
		name
	}
	description
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
		videos {
			videoUrl
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
			}
		}
		variations {
			originalName
			name
			values
		}
	}
	linkText
	productId
	productName
	properties {
		originalName
		name
		values
	}
	productReference
	jsonSpecifications
}`
