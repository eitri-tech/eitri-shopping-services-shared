// Facade — ponto de entrada do SDK, no padrão de Vtex/Shopify/Wake.
// Serviços acessíveis via Sales.user, Sales.vendor, Sales.cart e Sales.performance.
export { default as Sales } from './services/Sales'

// Tipos e modelos
export type { SalesConfigs } from './services/Sales'
export type { AuthStatus } from './models/Auth'
export type { SaveSalesAssistedInput } from './services/SalesCartService'
export type { SalesPerformanceData, SalesIndicators, StoreIndicators } from './services/SalesPerformanceService'

export * from './models/Vendor'
export * from './models/SalesCart'
