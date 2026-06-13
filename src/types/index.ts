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

export interface BeneficiaryData {
  fullName: string;
  idCard: string;
  phone: string;
  address: string;
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

export interface WhatsAppOrderData {
  sender: SenderData;
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
  orderDate: string;
}
