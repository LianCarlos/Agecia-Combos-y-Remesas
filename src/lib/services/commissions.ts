// ============================================================================
// Cálculo de comisiones de una remesa (§7.1 del plan)
//
// Módulo PURO: no importa Supabase ni React, así que se puede testear sin
// mocks. Implementa las fórmulas con base en la MONEDA DE ORIGEN (amountOrigin):
//
//   owner_fee    = isOwn ? 0 : amountOrigin × ownerFeePercent / 100
//   delivery_fee = amountOrigin × deliveryPercent / 100
//   agencia_fee  = amountOrigin × agenciaPercent / 100
//   referrer_fee = hasReferrer ? amountOrigin × referrerPercent / 100 : 0
//   beneficiary  = amountOrigin − owner_fee − delivery_fee − agencia_fee − referrer_fee
//
// Después se convierte todo a USDT (× rateToUsdt). La entrega en Cuba usa
// USDT→CUP (variable) o USDT→USD (1:1).
// ============================================================================

import type { DeliveryCurrency, PayoutRoleType } from "@/types";

/** Redondeo decimal estable (evita el polvo de punto flotante). */
export function roundMoney(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export interface CommissionInputs {
  /** Monto en moneda de origen (MXN, BRL, USD…). */
  amountOrigin: number;
  /** Tasa origen → USDT (unidades USDT por 1 de origen). */
  rateToUsdt: number;
  /** Tasa USDT → CUP (ignorada si deliveryCurrency = 'USD'). */
  rateUsdtToDelivery: number;
  /** Moneda de entrega en Cuba. */
  deliveryCurrency: DeliveryCurrency;
  /** Cuenta propia → no cobra comisión de dueño. */
  isOwn: boolean;
  /** % del dueño de la cuenta sobre amountOrigin. */
  ownerFeePercent: number;
  /** % del entregador sobre amountOrigin (por país). */
  deliveryPercent: number;
  /** % de la agencia sobre amountOrigin (por país). */
  agenciaPercent: number;
  /** % del referidor sobre amountOrigin (por país). */
  referrerPercent: number;
  /** Hay referidor atribuido. */
  hasReferrer: boolean;
}

/** Fila de `remittance_payouts` a insertar (snapshot). */
export interface RemittancePayoutInput {
  roleType: PayoutRoleType;
  /** % snapshot sobre amountOrigin. */
  percent: number;
  /** Monto en USDT (snapshot, 4 decimales). */
  amountUsdt: number;
}

export interface CommissionBreakdown {
  // En moneda de origen (2 decimales)
  ownerFee: number;
  deliveryFee: number;
  agenciaFee: number;
  referrerFee: number;
  beneficiary: number;
  // En USDT (4 decimales)
  usdtReceived: number;
  ownerFeeUsdt: number;
  deliveryFeeUsdt: number;
  agenciaFeeUsdt: number;
  referrerFeeUsdt: number;
  beneficiaryUsdt: number;
  usdtToCuba: number;
  // Monto final que recibe el beneficiario en Cuba (CUP o USD, 2 decimales)
  amountReceive: number;
  // Desglose para remittance_payouts (solo montos > 0)
  payouts: RemittancePayoutInput[];
}

export function computeRemittance(inputs: CommissionInputs): CommissionBreakdown {
  const {
    amountOrigin,
    rateToUsdt,
    rateUsdtToDelivery,
    deliveryCurrency,
    isOwn,
    ownerFeePercent,
    deliveryPercent,
    agenciaPercent,
    referrerPercent,
    hasReferrer,
  } = inputs;

  // Fees en moneda de origen (sobre amountOrigin), redondeados a 2 decimales.
  const ownerFee = isOwn ? 0 : roundMoney(amountOrigin * (ownerFeePercent / 100), 2);
  const deliveryFee = roundMoney(amountOrigin * (deliveryPercent / 100), 2);
  const agenciaFee = roundMoney(amountOrigin * (agenciaPercent / 100), 2);
  const referrerFee = hasReferrer ? roundMoney(amountOrigin * (referrerPercent / 100), 2) : 0;

  const beneficiary = roundMoney(
    amountOrigin - ownerFee - deliveryFee - agenciaFee - referrerFee,
    2
  );

  // Conversión a USDT (4 decimales).
  const usdtReceived = roundMoney(amountOrigin * rateToUsdt, 4);
  const ownerFeeUsdt = roundMoney(ownerFee * rateToUsdt, 4);
  const deliveryFeeUsdt = roundMoney(deliveryFee * rateToUsdt, 4);
  const agenciaFeeUsdt = roundMoney(agenciaFee * rateToUsdt, 4);
  const referrerFeeUsdt = roundMoney(referrerFee * rateToUsdt, 4);
  const beneficiaryUsdt = roundMoney(beneficiary * rateToUsdt, 4);

  // Lo que viaja a Cuba: el beneficiario más la comisión del entregador.
  const usdtToCuba = roundMoney(beneficiaryUsdt + deliveryFeeUsdt, 4);

  // Entrega al beneficiario: USDT→CUP (variable) o USDT→USD (1:1).
  const deliveryRate = deliveryCurrency === "USD" ? 1 : rateUsdtToDelivery;
  const amountReceive = roundMoney(beneficiaryUsdt * deliveryRate, 2);

  // Payouts: solo los que generan monto > 0.
  const payouts: RemittancePayoutInput[] = [];
  if (ownerFeeUsdt > 0) {
    payouts.push({ roleType: "owner", percent: ownerFeePercent, amountUsdt: ownerFeeUsdt });
  }
  if (deliveryFeeUsdt > 0) {
    payouts.push({ roleType: "delivery", percent: deliveryPercent, amountUsdt: deliveryFeeUsdt });
  }
  if (agenciaFeeUsdt > 0) {
    payouts.push({ roleType: "agencia", percent: agenciaPercent, amountUsdt: agenciaFeeUsdt });
  }
  if (referrerFeeUsdt > 0) {
    payouts.push({ roleType: "referrer", percent: referrerPercent, amountUsdt: referrerFeeUsdt });
  }

  return {
    ownerFee,
    deliveryFee,
    agenciaFee,
    referrerFee,
    beneficiary,
    usdtReceived,
    ownerFeeUsdt,
    deliveryFeeUsdt,
    agenciaFeeUsdt,
    referrerFeeUsdt,
    beneficiaryUsdt,
    usdtToCuba,
    amountReceive,
    payouts,
  };
}
