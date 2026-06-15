export const productReturn = `{
	brand
	brandId
	categoryId
	categoryTree {
		id
		name
		href
	}
	deliveryPromisesBadges {
	  typeName
	  pickupId
	  pickupName
	}
	description
	clusterHighlights {
    	id
    	name
    }
   productClusters {
  		id
   		name
   }
   itemMetadata {
        items {
            id
            imageUrl
            name
            seller
            assemblyOptions {
                id
                name
                required
                inputValues {
                    defaultValue
                    label
                    maxLength
                    type
                    domain
                }
            }
        }
   }
	items {
		itemId
		 attachments {
            id
            name
            required
        }
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
		kitItems {
            itemId
            amount
            product {
                productId
                productName
            }
            sku {
                name
                nameComplete
                complementName
                variations {
                    originalName
                    name
                    values
                }
                images {
                    imageUrl
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
            }
        }
		videos {
			videoUrl
		}
		sellers {
			sellerId
			sellerName
			sellerDefault
			commertialOffer {
				DeliverySlaSamples {
					Region {
						Id
						ZipCode
					}
					DeliverySlaPerTypes {
						TypeName
						Price
						EstimatedTimeSpanToDelivery
					}
				}
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
