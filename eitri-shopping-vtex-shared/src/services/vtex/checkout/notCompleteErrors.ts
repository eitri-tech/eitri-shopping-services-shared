/**
 * Códigos de erro VTEX que indicam "o usuário precisa agir" — não são falhas do sistema.
 * Erros nesta lista são logados como ORDER-NOT-COMPLETED em vez de ERROR no Datadog.
 *
 * Referência: https://developers.vtex.com/docs/guides/checkout-error-codes
 */
export const NOT_COMPLETE_ERRORS = [
	'CHK0016', // Payment value does not match with reference value
	'CHK003', // Access denied (sessão expirada / token inválido)
	'CHK0080', // Maximum denied transactions reached (24h block)
	'CHK0081', // Specified user is not valid
	'CHK0085', // Order already exists (double-click)
	'CHK0087', // Login required to use a new address
	'CHK0109', // Email belongs to another user
	'CHK0131', // Invalid e-mail
	'CHK0209', // No payment selected
	'CHK0223', // Payment not authorized
	'CHK0246', // Purchase with unavailable items
	'CHK0328', // (código legado/interno — não documentado)
	'ORD007', // Invalid client profile field
	'ORD023', // Unavailable items in cart
	'ORD062' // Access denied / Unauthorized
]
