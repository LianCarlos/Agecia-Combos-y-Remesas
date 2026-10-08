import type { Json } from "./database.types";

// ============================================================================
// Tipos de Entidad (reflejan las tablas de la BD)
// ============================================================================

export interface WholesaleRate {
  id: string;
  payment_method_id: string;
  min_amount: number;
  rate: number;
  active: boolean;
  created_at: string;
  payment_methods?: { id: string; name: string } | null;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  active: boolean | null;
  created_at: string | null;
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
// Operaciones (migración 008) — pedidos, remesas, cuentas, comisiones, tasas
// USDT, países de origen y referidos.
// ============================================================================

export type AccountType =
  | 'zelle'
  | 'bank_transfer'
  | 'cash'
  | 'wallet'
  | 'card'
  | 'other';

export type OrderType =
  | 'remittance'
  | 'combo'
  | 'product'
  | 'recharge'
  | 'cart';

export type OrderStatus = 'nuevo' | 'procesando' | 'completado' | 'cancelado';

export type RemittanceStatus =
  | 'pendiente_recibo'
  | 'recibida'
  | 'en_reparto'
  | 'entregada'
  | 'cancelada';

/** Roles que cobran comisión por país (configuración). */
export type CommissionRoleType = 'delivery' | 'agencia' | 'referrer';

/** Roles de pago dentro de una remesa (snapshot). */
export type PayoutRoleType = 'owner' | 'delivery' | 'agencia' | 'referrer';

export type DeliveryCurrency = 'CUP' | 'USD';

/** País de origen (catálogo `countries` extendido). */
export interface Country {
  id: string;
  name: string;
  flag_icon: string | null;
  currency_code: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

/** Cuenta donde se recibe el dinero del cliente. */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency_id: string | null;
  country_id: string | null;
  is_own: boolean;
  owner_name: string | null;
  owner_fee_percent: number;
  account_details: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DeliveryPerson {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

/** Tasa de conversión (USDT pivote): unidades de `to_code` por 1 de `from_code`. */
export interface ConversionRate {
  id: string;
  from_code: string;
  to_code: string;
  rate: number;
  updated_at: string;
}

/** % de comisión por país (entregador / agencia / referidor). */
export interface CommissionConfig {
  id: string;
  country_id: string;
  role_type: CommissionRoleType;
  percent: number;
  updated_at: string;
  countries?: Country | null;
}

export interface Referrer {
  id: string;
  full_name: string;
  phone: string | null;
  referral_code: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ReferralClick {
  id: string;
  referrer_id: string;
  referral_code: string;
  created_at: string;
}

/** Pedido entrante (remesa / combo / producto / recarga / carrito). */
export interface Order {
  id: string;
  order_type: OrderType;
  sender_name: string | null;
  sender_phone: string | null;
  sender_country: string | null;
  beneficiary_name: string | null;
  beneficiary_ci: string | null;
  beneficiary_phone: string | null;
  beneficiary_address: string | null;
  beneficiary_card_number: string | null;
  beneficiary_confirmation_phone: string | null;
  country_id: string | null;
  currency_code: string | null;
  payment_method_id: string | null;
  delivery_method_id: string | null;
  amount_origin: number | null;
  amount_usd: number | null;
  receiving_amount: number | null;
  rate_multiplier: number | null;
  referrer_id: string | null;
  referral_code: string | null;
  status: OrderStatus;
  payload: Json;
  whatsapp_sent_at: string | null;
  created_at: string;
  // Joins
  countries?: Country | null;
  referrers?: Referrer | null;
  order_items?: OrderItem[] | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  kind: 'combo' | 'product';
  item_id: string | null;
  title: string;
  price_usd: number;
  quantity: number;
  created_at: string;
}

/** Ítem a persistir en `order_items` (carrito de combos + productos). */
export interface OrderItemInput {
  kind: 'combo' | 'product';
  item_id?: string | null;
  title: string;
  price_usd: number;
  quantity: number;
}

/**
 * Payload del cliente para crear un pedido (Server Action `createOrder`).
 * El `referrer_id`/`referral_code` NO van aquí: se resuelven en el servidor
 * desde la cookie `mr_ref`, no desde un campo que el cliente pueda falsear.
 */
export interface CreateOrderInput {
  order_type: OrderType;
  sender_name?: string | null;
  sender_phone?: string | null;
  sender_country?: string | null;
  beneficiary_name?: string | null;
  beneficiary_ci?: string | null;
  beneficiary_phone?: string | null;
  beneficiary_address?: string | null;
  beneficiary_card_number?: string | null;
  beneficiary_confirmation_phone?: string | null;
  country_id?: string | null;
  currency_code?: string | null;
  payment_method_id?: string | null;
  delivery_method_id?: string | null;
  amount_origin?: number | null;
  amount_usd?: number | null;
  receiving_amount?: number | null;
  rate_multiplier?: number | null;
  payload?: Json;
  items?: OrderItemInput[];
}

/** Remesa (nace de procesar un pedido `remittance`). */
export interface Remittance {
  id: string;
  order_id: string | null;
  reference: string | null;
  country_id: string | null;
  currency_id: string | null;
  payment_method_id: string | null;
  account_id: string | null;
  delivery_method_id: string | null;
  delivery_person_id: string | null;
  referrer_id: string | null;
  amount_origin: number;
  rate_to_usdt: number;
  usdt_received: number;
  owner_fee_percent: number;
  owner_fee_usdt: number;
  delivery_currency: DeliveryCurrency;
  rate_usdt_to_delivery: number;
  amount_receive: number;
  beneficiary_name: string;
  beneficiary_phone: string | null;
  beneficiary_address: string | null;
  status: RemittanceStatus;
  notes: string | null;
  created_by: string | null;
  received_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  countries?: Country | null;
  currencies?: Currency | null;
  accounts?: Account | null;
  delivery_persons?: DeliveryPerson | null;
  referrers?: Referrer | null;
  remittance_payouts?: RemittancePayout[] | null;
}

export interface RemittancePayout {
  id: string;
  remittance_id: string;
  role_type: PayoutRoleType;
  participant_name: string | null;
  percent: number;
  amount_usdt: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

// ============================================================================
// Dashboard operativo
// ============================================================================

export interface CountryStat {
  countryId: string;
  countryName: string;
  orders: number;
  usdtReceived: number;
  profitUsdt: number;
}

export interface AccountStat {
  accountId: string;
  accountName: string;
  isOwn: boolean;
  remittances: number;
  totalReceivedUsdt: number;
}

export interface DeliveryPersonStat {
  deliveryPersonId: string;
  name: string;
  deliveries: number;
  deliveredAmount: number;
  commissionAccruedUsdt: number;
  commissionPendingUsdt: number;
}

export interface ReferrerStat {
  referrerId: string;
  name: string;
  clicks: number;
  attributedOrders: number;
  commissionAccruedUsdt: number;
  commissionPendingUsdt: number;
}

export interface DashboardStats {
  orders: {
    total: number;
    byType: Record<OrderType, number>;
    byStatus: Record<OrderStatus, number>;
  };
  remittances: {
    total: number;
    byStatus: Record<RemittanceStatus, number>;
    usdtReceived: number;
    cupDelivered: number;
    usdDelivered: number;
    profitUsdt: number;
  };
  commissions: {
    accruedUsdt: number;
    paidUsdt: number;
    pendingUsdt: number;
  };
  byCountry: CountryStat[];
  byAccount: AccountStat[];
  byDeliveryPerson: DeliveryPersonStat[];
  byReferrer: ReferrerStat[];
  rates: ConversionRate[];
  recentOrders: Order[];
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
