// ============================================================================
// Tipos de Entidad (reflejan las tablas de la BD)
// ============================================================================

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  active: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
  currency_id: string | null;
  created_at: string;
  // Join
  currencies?: Currency | null;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  active: boolean;
  type: 'cash' | 'transfer' | 'card' | null;
  created_at: string;
}

export interface ExchangeRate {
  payment_method_id: string;
  delivery_method_id: string;
  rate: number;
  updated_at: string;
  // Joins
  payment_methods?: PaymentMethod | null;
  delivery_methods?: DeliveryMethod | null;
}

export interface Combo {
  id: string;
  title: string;
  description: string | null;
  price_usd: number;
  image_url: string | null;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MobileRecharge {
  id: string;
  title: string;
  description: string | null;
  price_usd: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price_usd: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'superadmin' | 'empleado';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Tipos de Formulario / Display
// ============================================================================

export interface RemittanceFormData {
  originCountry: string;
  originCurrency: string;
  paymentMethodId: string;
  deliveryMethodId: string;
  amount: number;
}

export interface RemittanceResult {
  rateMultiplier: number;
  receivingAmount: number;
  originAmount: number;
  originCountry: string;
  originCurrency: string;
  paymentMethodName: string;
  deliveryMethodName: string;
}

export interface RateDisplay {
  paymentMethodId: string;
  deliveryMethodId: string;
  paymentMethod: string;
  deliveryMethod: string;
  currencyCode: string;
  currencySymbol: string;
  rate: number;
  updatedAt: string;
}

/**
 * Fila de la matriz de tasas usada por los catálogos (combos, productos,
 * recargas) para convertir un precio en USD a la moneda del método de pago.
 * Es un subconjunto de lo que devuelve /api/exchange-rates.
 */
export interface RateInfo {
  paymentMethodId: string;
  deliveryMethodId: string;
  deliveryMethod: string;
  currencyCode: string;
  currencySymbol: string;
  rate: number;
}

/** Método de pago reducido para los selectores de los catálogos. */
export interface PMInfo {
  id: string;
  name: string;
  active: boolean;
  currencies?: { code: string; symbol: string } | null;
}

/** Tasa simplificada (display) para las tarjetas de recargas. */
export interface CupRate {
  paymentMethod: string;
  deliveryMethod: string;
  rate: number;
}

/**
 * Datos de la calculadora precargados en el servidor (SSR) y pasados al
 * cliente como props iniciales, para que funcione aunque la BD esté caída.
 */
export interface CalculatorData {
  currencies: Currency[];
  paymentMethods: PaymentMethod[];
  deliveryMethods: DeliveryMethod[];
  exchangeRates: RateDisplay[];
}

export interface BeneficiaryData {
  fullName: string;
  idCard: string;
  phone: string;
  address: string;
  cardNumber?: string;
  confirmationPhone?: string;
}

export interface SenderData {
  fullName: string;
  phone: string;
  country: string;
}

export interface ComboOrder {
  title: string;
  price_usd: number;
  quantity: number;
  total: number;
}

// ============================================================================
// Carrito (combos + productos)
// ============================================================================

export interface CartItem {
  id: string;
  kind: 'combo' | 'product';
  title: string;
  price_usd: number;
  quantity: number;
}

export interface CartOrder {
  items: CartItem[];
  total: number;            // total en USD
  paymentMethod?: string;   // método de pago elegido (opcional)
  payAmountLabel?: string;  // monto a pagar ya convertido, ej "1250.00 CUP"
}

export interface WhatsAppOrderData {
  /** Emisor: opcional — pedidos de combos/productos no siempre lo incluyen. */
  sender?: SenderData;
  beneficiary: BeneficiaryData;
  remittance?: {
    originAmount: number;
    receivingAmount: number;
    rateMultiplier: number;
    originCountry: string;
    originCurrency: string;
    paymentMethod: string;
    deliveryMethod: string;
  };
  combo?: ComboOrder;
  cart?: CartOrder;
  orderDate: string;
}
