import { computeRemittance, roundMoney } from "../commissions";
import type { CommissionInputs } from "../commissions";

// Base: remesa de México (10000 MXN), cuenta ajena (owner 5%), tasas limpias.
const base: CommissionInputs = {
  amountOrigin: 10000,
  rateToUsdt: 0.05, // 1 MXN = 0.05 USDT
  rateUsdtToDelivery: 345, // 1 USDT = 345 CUP
  deliveryCurrency: "CUP",
  isOwn: false,
  ownerFeePercent: 5,
  deliveryPercent: 4, // México
  agenciaPercent: 8, // México
  referrerPercent: 3, // México
  hasReferrer: true,
};

describe("roundMoney", () => {
  it("redondea a 2 decimales por defecto", () => {
    expect(roundMoney(100.555)).toBe(100.56);
    expect(roundMoney(100.554)).toBe(100.55);
  });

  it("redondea a la cantidad de decimales indicada", () => {
    expect(roundMoney(1.23456, 4)).toBe(1.2346);
    expect(roundMoney(1.23454, 4)).toBe(1.2345);
  });
});

describe("computeRemittance — desglose por país (cuenta ajena)", () => {
  it("calcula fees y beneficiario sobre la moneda de origen", () => {
    const r = computeRemittance(base);

    expect(r.ownerFee).toBeCloseTo(500, 2);
    expect(r.deliveryFee).toBeCloseTo(400, 2);
    expect(r.agenciaFee).toBeCloseTo(800, 2);
    expect(r.referrerFee).toBeCloseTo(300, 2);
    // 10000 − 500 − 400 − 800 − 300
    expect(r.beneficiary).toBeCloseTo(8000, 2);
  });

  it("convierte todo a USDT (4 decimales)", () => {
    const r = computeRemittance(base);

    expect(r.usdtReceived).toBeCloseTo(500, 4);
    expect(r.ownerFeeUsdt).toBeCloseTo(25, 4);
    expect(r.deliveryFeeUsdt).toBeCloseTo(20, 4);
    expect(r.agenciaFeeUsdt).toBeCloseTo(40, 4);
    expect(r.referrerFeeUsdt).toBeCloseTo(15, 4);
    expect(r.beneficiaryUsdt).toBeCloseTo(400, 4);
  });

  it("usdtToCuba = beneficiario + comisión del entregador", () => {
    const r = computeRemittance(base);
    expect(r.usdtToCuba).toBeCloseTo(420, 4); // 400 + 20
  });

  it("genera los 4 payouts (owner, delivery, agencia, referrer)", () => {
    const r = computeRemittance(base);

    const byRole = Object.fromEntries(r.payouts.map((p) => [p.roleType, p.amountUsdt]));
    expect(byRole).toEqual({
      owner: 25,
      delivery: 20,
      agencia: 40,
      referrer: 15,
    });
  });
});

describe("computeRemittance — entrega CUP vs USD", () => {
  it("CUP: amount_receive = beneficiary_usdt × tasa USDT→CUP", () => {
    const r = computeRemittance(base);
    expect(r.amountReceive).toBeCloseTo(138000, 2); // 400 × 345
  });

  it("USD: amount_receive = beneficiary_usdt × 1 (1:1)", () => {
    const r = computeRemittance({ ...base, deliveryCurrency: "USD" });
    expect(r.amountReceive).toBeCloseTo(400, 2); // 400 × 1
  });
});

describe("computeRemittance — cuenta propia", () => {
  it("no cobra comisión de dueño y no genera payout de owner", () => {
    const r = computeRemittance({ ...base, isOwn: true });

    expect(r.ownerFee).toBe(0);
    expect(r.ownerFeeUsdt).toBe(0);
    // 10000 − 0 − 400 − 800 − 300
    expect(r.beneficiary).toBeCloseTo(8500, 2);
    expect(r.beneficiaryUsdt).toBeCloseTo(425, 4);

    expect(r.payouts.some((p) => p.roleType === "owner")).toBe(false);
    expect(r.payouts).toHaveLength(3); // delivery, agencia, referrer
  });
});

describe("computeRemittance — referidor", () => {
  it("sin referidor: no cobra comisión y no genera payout de referrer", () => {
    const r = computeRemittance({ ...base, hasReferrer: false });

    expect(r.referrerFee).toBe(0);
    expect(r.referrerFeeUsdt).toBe(0);
    // 10000 − 500 − 400 − 800 − 0
    expect(r.beneficiary).toBeCloseTo(8300, 2);

    expect(r.payouts.some((p) => p.roleType === "referrer")).toBe(false);
    expect(r.payouts).toHaveLength(3); // owner, delivery, agencia
  });
});

describe("computeRemittance — distintos % por país (México vs Brasil)", () => {
  it("produce comisiones y ganancia distintas", () => {
    // Brasil: delivery 6%, agencia 12%, referrer 4%.
    const brasil = computeRemittance({
      ...base,
      deliveryPercent: 6,
      agenciaPercent: 12,
      referrerPercent: 4,
    });

    const mexico = computeRemittance(base);

    expect(brasil.agenciaFee).toBeCloseTo(1200, 2);
    expect(mexico.agenciaFee).toBeCloseTo(800, 2);

    expect(brasil.agenciaFeeUsdt).toBeCloseTo(60, 4);
    expect(mexico.agenciaFeeUsdt).toBeCloseTo(40, 4);

    expect(brasil.agenciaFee).toBeGreaterThan(mexico.agenciaFee);
    expect(brasil.amountReceive).toBeLessThan(mexico.amountReceive);
  });
});
