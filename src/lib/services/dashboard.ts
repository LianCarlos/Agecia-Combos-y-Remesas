import { supabaseAdmin } from "@/lib/supabase/admin";
import { roundMoney } from "./commissions";
import type {
  AccountStat,
  ConversionRate,
  CountryStat,
  DashboardStats,
  DeliveryPersonStat,
  Order,
  OrderStatus,
  OrderType,
  ReferrerStat,
  RemittanceStatus,
} from "@/types";

// ============================================================================
// Dashboard operativo — agregación de pedidos, remesas, comisiones y referidos
// ----------------------------------------------------------------------------
// Los totales se calculan aquí (en JS) porque PostgREST no expone GROUP BY
// directo. Para volúmenes altos convendría mover esto a una función SQL/RPC;
// a la escala de la plataforma es aceptable. Usa supabaseAdmin: la página ya
// está detrás del guard de admin del layout.
// ============================================================================

const ORDER_TYPES: OrderType[] = ["remittance", "combo", "product", "recharge", "cart"];
const ORDER_STATUSES: OrderStatus[] = ["nuevo", "procesando", "completado", "cancelado"];
const REMITTANCE_STATUSES: RemittanceStatus[] = [
  "pendiente_recibo",
  "recibida",
  "en_reparto",
  "entregada",
  "cancelada",
];

function emptyByType(): Record<OrderType, number> {
  return { remittance: 0, combo: 0, product: 0, recharge: 0, cart: 0 };
}
function emptyByStatus(): Record<OrderStatus, number> {
  return { nuevo: 0, procesando: 0, completado: 0, cancelado: 0 };
}
function emptyByRemStatus(): Record<RemittanceStatus, number> {
  return { pendiente_recibo: 0, recibida: 0, en_reparto: 0, entregada: 0, cancelada: 0 };
}

const toNum = (v: unknown): number => (v == null ? 0 : Number(v));

// Filas crudas (las columnas numeric llegan como string|number según PostgREST).
interface RawOrder {
  id: string;
  order_type: string;
  status: string;
  country_id: string | null;
  referrer_id: string | null;
  created_at: string;
  beneficiary_name: string | null;
  amount_origin: unknown;
  amount_usd: unknown;
  currency_code: string | null;
  countries?: { name: string; flag_icon: string | null } | null;
  referrers?: { full_name: string } | null;
}
interface RawRemittance {
  id: string;
  status: string;
  delivery_currency: string;
  amount_receive: unknown;
  usdt_received: unknown;
  country_id: string | null;
  account_id: string | null;
  delivery_person_id: string | null;
  referrer_id: string | null;
}
interface RawPayout { remittance_id: string; role_type: string; amount_usdt: unknown; paid: boolean; }
interface RawAccount { id: string; name: string; is_own: boolean; }
interface RawPerson { id: string; full_name: string; }
interface RawClick { referrer_id: string; }
interface RawRate { id: string; from_code: string; to_code: string; rate: unknown; updated_at: string; }
interface RawCountry { id: string; name: string; }

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    ordersRes,
    remittancesRes,
    payoutsRes,
    accountsRes,
    personsRes,
    referrersRes,
    clicksRes,
    ratesRes,
    countriesRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id, order_type, status, country_id, referrer_id, created_at, beneficiary_name, amount_origin, amount_usd, currency_code, countries(name, flag_icon), referrers(full_name)")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("remittances")
      .select("id, status, delivery_currency, amount_receive, usdt_received, country_id, account_id, delivery_person_id, referrer_id"),
    supabaseAdmin.from("remittance_payouts").select("remittance_id, role_type, amount_usdt, paid"),
    supabaseAdmin.from("accounts").select("id, name, is_own"),
    supabaseAdmin.from("delivery_persons").select("id, full_name"),
    supabaseAdmin.from("referrers").select("id, full_name"),
    supabaseAdmin.from("referral_clicks").select("referrer_id"),
    supabaseAdmin.from("conversion_rates").select("id, from_code, to_code, rate, updated_at"),
    supabaseAdmin.from("countries").select("id, name"),
  ]);

  const rawOrders = (ordersRes.data ?? []) as RawOrder[];
  const remittances = (remittancesRes.data ?? []) as RawRemittance[];
  const payouts = (payoutsRes.data ?? []) as RawPayout[];
  const accounts = (accountsRes.data ?? []) as RawAccount[];
  const persons = (personsRes.data ?? []) as RawPerson[];
  const referrers = (referrersRes.data ?? []) as RawPerson[];
  const clicks = (clicksRes.data ?? []) as RawClick[];
  const rates = (ratesRes.data ?? []) as RawRate[];
  const countries = (countriesRes.data ?? []) as RawCountry[];

  const countryName = new Map(countries.map((c) => [c.id, c.name]));

  // ─── Pedidos ───
  const byType = emptyByType();
  const byStatus = emptyByStatus();
  const countryOrders = new Map<string, number>();
  const orderByReferrer = new Map<string, number>();
  for (const o of rawOrders) {
    byType[o.order_type as OrderType] = (byType[o.order_type as OrderType] ?? 0) + 1;
    byStatus[o.status as OrderStatus] = (byStatus[o.status as OrderStatus] ?? 0) + 1;
    if (o.country_id) countryOrders.set(o.country_id, (countryOrders.get(o.country_id) ?? 0) + 1);
    if (o.referrer_id) orderByReferrer.set(o.referrer_id, (orderByReferrer.get(o.referrer_id) ?? 0) + 1);
  }

  // ─── Payouts por remesa y rol ───
  const payoutByRemittance = new Map<
    string,
    { delivery: number; deliveryPending: number; agencia: number; referrer: number; referrerPending: number }
  >();
  let accruedUsdt = 0;
  let paidUsdt = 0;
  let pendingUsdt = 0;
  for (const p of payouts) {
    const amt = toNum(p.amount_usdt);
    accruedUsdt += amt;
    if (p.paid) paidUsdt += amt;
    else pendingUsdt += amt;

    const slot = payoutByRemittance.get(p.remittance_id) ?? {
      delivery: 0,
      deliveryPending: 0,
      agencia: 0,
      referrer: 0,
      referrerPending: 0,
    };
    if (p.role_type === "delivery") {
      slot.delivery += amt;
      if (!p.paid) slot.deliveryPending += amt;
    } else if (p.role_type === "agencia") {
      slot.agencia += amt;
    } else if (p.role_type === "referrer") {
      slot.referrer += amt;
      if (!p.paid) slot.referrerPending += amt;
    }
    payoutByRemittance.set(p.remittance_id, slot);
  }

  // ─── Remesas ───
  const byRemStatus = emptyByRemStatus();
  let usdtReceived = 0;
  let cupDelivered = 0;
  let usdDelivered = 0;
  let profitUsdt = 0;

  const countryUsdt = new Map<string, number>();
  const countryProfit = new Map<string, number>();
  const accountStats = new Map<string, { remittances: number; totalUsdt: number }>();
  const deliveryStats = new Map<string, { deliveries: number; amount: number; accrued: number; pending: number }>();
  const referrerCommission = new Map<string, { accrued: number; pending: number }>();

  for (const r of remittances) {
    byRemStatus[r.status as RemittanceStatus] = (byRemStatus[r.status as RemittanceStatus] ?? 0) + 1;
    const usdt = toNum(r.usdt_received);
    const received = toNum(r.amount_receive);
    const slot = payoutByRemittance.get(r.id) ?? {
      delivery: 0,
      deliveryPending: 0,
      agencia: 0,
      referrer: 0,
      referrerPending: 0,
    };

    usdtReceived += usdt;
    if (r.delivery_currency === "USD") usdDelivered += received;
    else cupDelivered += received;
    profitUsdt += slot.agencia;

    if (r.country_id) {
      countryUsdt.set(r.country_id, (countryUsdt.get(r.country_id) ?? 0) + usdt);
      countryProfit.set(r.country_id, (countryProfit.get(r.country_id) ?? 0) + slot.agencia);
    }
    if (r.account_id) {
      const s = accountStats.get(r.account_id) ?? { remittances: 0, totalUsdt: 0 };
      s.remittances += 1;
      s.totalUsdt += usdt;
      accountStats.set(r.account_id, s);
    }
    if (r.delivery_person_id) {
      const s = deliveryStats.get(r.delivery_person_id) ?? { deliveries: 0, amount: 0, accrued: 0, pending: 0 };
      s.deliveries += 1;
      s.amount += received;
      s.accrued += slot.delivery;
      s.pending += slot.deliveryPending;
      deliveryStats.set(r.delivery_person_id, s);
    }
    if (r.referrer_id) {
      const s = referrerCommission.get(r.referrer_id) ?? { accrued: 0, pending: 0 };
      s.accrued += slot.referrer;
      s.pending += slot.referrerPending;
      referrerCommission.set(r.referrer_id, s);
    }
  }

  // ─── Referidos: clicks por referidor ───
  const clickCount = new Map<string, number>();
  for (const c of clicks) clickCount.set(c.referrer_id, (clickCount.get(c.referrer_id) ?? 0) + 1);

  // ─── Ensamblar los arreglos ───
  const byCountry: CountryStat[] = Array.from(
    new Set([...countryUsdt.keys(), ...countryOrders.keys()])
  )
    .map((id) => ({
      countryId: id,
      countryName: countryName.get(id) ?? "—",
      orders: countryOrders.get(id) ?? 0,
      usdtReceived: roundMoney(countryUsdt.get(id) ?? 0, 2),
      profitUsdt: roundMoney(countryProfit.get(id) ?? 0, 4),
    }))
    .sort((a, b) => b.usdtReceived - a.usdtReceived);

  const byAccount: AccountStat[] = accounts
    .map((a) => {
      const s = accountStats.get(a.id);
      return {
        accountId: a.id,
        accountName: a.name,
        isOwn: !!a.is_own,
        remittances: s?.remittances ?? 0,
        totalReceivedUsdt: roundMoney(s?.totalUsdt ?? 0, 2),
      };
    })
    .sort((a, b) => b.totalReceivedUsdt - a.totalReceivedUsdt);

  const byDeliveryPerson: DeliveryPersonStat[] = persons
    .map((p) => {
      const s = deliveryStats.get(p.id);
      return {
        deliveryPersonId: p.id,
        name: p.full_name,
        deliveries: s?.deliveries ?? 0,
        deliveredAmount: roundMoney(s?.amount ?? 0, 2),
        commissionAccruedUsdt: roundMoney(s?.accrued ?? 0, 4),
        commissionPendingUsdt: roundMoney(s?.pending ?? 0, 4),
      };
    })
    .sort((a, b) => b.deliveries - a.deliveries);

  const byReferrer: ReferrerStat[] = referrers
    .map((rf) => {
      const s = referrerCommission.get(rf.id);
      return {
        referrerId: rf.id,
        name: rf.full_name,
        clicks: clickCount.get(rf.id) ?? 0,
        attributedOrders: orderByReferrer.get(rf.id) ?? 0,
        commissionAccruedUsdt: roundMoney(s?.accrued ?? 0, 4),
        commissionPendingUsdt: roundMoney(s?.pending ?? 0, 4),
      };
    })
    .sort((a, b) => b.clicks - a.clicks);

  const ratesArr: ConversionRate[] = rates.map((r) => ({
    id: r.id,
    from_code: r.from_code,
    to_code: r.to_code,
    rate: toNum(r.rate),
    updated_at: r.updated_at,
  }));

  return {
    orders: {
      total: rawOrders.length,
      byType,
      byStatus,
    },
    remittances: {
      total: remittances.length,
      byStatus: byRemStatus,
      usdtReceived: roundMoney(usdtReceived, 2),
      cupDelivered: roundMoney(cupDelivered, 2),
      usdDelivered: roundMoney(usdDelivered, 2),
      profitUsdt: roundMoney(profitUsdt, 4),
    },
    commissions: {
      accruedUsdt: roundMoney(accruedUsdt, 4),
      paidUsdt: roundMoney(paidUsdt, 4),
      pendingUsdt: roundMoney(pendingUsdt, 4),
    },
    byCountry,
    byAccount,
    byDeliveryPerson,
    byReferrer,
    rates: ratesArr,
    recentOrders: rawOrders.slice(0, 10) as unknown as Order[],
  };
}
