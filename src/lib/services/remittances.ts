import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeRemittance } from "./commissions";
import type {
  DeliveryCurrency,
  Order,
  PayoutRoleType,
  Remittance,
  RemittanceStatus,
} from "@/types";

// ============================================================================
// Remesas — procesar pedidos `remittance` con cálculo en vivo (§7.1 del plan)
// ----------------------------------------------------------------------------
// El pedido ya trae: país, moneda, método de pago/entrega, monto, beneficiario
// y referido. El admin completa cuenta + entregador y confirma; aquí se calcula
// todo el desglose (USDT pivote, comisiones por país) y se persisten snapshot
// en `remittances` + `remittance_payouts`.
// ============================================================================

export interface RemittanceFilters {
  status?: string;
  countryId?: string;
}

const REMITTANCE_SELECT = `*, countries(name, flag_icon), accounts(name, type, is_own, owner_name), delivery_persons(full_name), referrers(full_name), remittance_payouts(*)`;

export async function getRemittances(
  filters: RemittanceFilters = {}
): Promise<Remittance[]> {
  let query = supabaseAdmin
    .from("remittances")
    .select(REMITTANCE_SELECT)
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.countryId) query = query.eq("country_id", filters.countryId);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching remittances:", error);
    return [];
  }
  return (data ?? []) as Remittance[];
}

export async function getRemittance(id: string): Promise<Remittance | null> {
  const { data, error } = await supabaseAdmin
    .from("remittances")
    .select(REMITTANCE_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Remittance;
}

/**
 * Pedidos de tipo `remittance` que aún NO tienen una fila en `remittances`
 * (es decir, pendientes de procesar).
 */
export async function getPendingRemittanceOrders(): Promise<Order[]> {
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("*, countries(name, flag_icon), referrers(full_name)")
    .eq("order_type", "remittance")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching remittance orders:", error);
    return [];
  }

  const { data: remittances } = await supabaseAdmin
    .from("remittances")
    .select("order_id");

  const processed = new Set(
    (remittances ?? []).map((r) => r.order_id).filter(Boolean) as string[]
  );

  return ((orders ?? []) as Order[]).filter((o) => !processed.has(o.id));
}

async function getRateRow(fromCode: string, toCode: string): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from("conversion_rates")
    .select("rate")
    .eq("from_code", fromCode.toUpperCase())
    .eq("to_code", toCode.toUpperCase())
    .maybeSingle();

  return data ? Number(data.rate) : null;
}

export interface ProcessRemittanceInput {
  orderId: string;
  accountId: string;
  deliveryPersonId?: string | null;
  deliveryMethodId?: string | null;
  deliveryCurrency: DeliveryCurrency;
  notes?: string | null;
  /** Id del admin que procesa (profiles.id), para `remittances.created_by`. */
  createdById?: string | null;
}

function participantName(
  role: PayoutRoleType,
  ctx: { accountName: string; ownerName: string | null; deliveryPersonName: string | null; referrerName: string | null }
): string {
  switch (role) {
    case "owner":
      return ctx.ownerName || ctx.accountName;
    case "delivery":
      return ctx.deliveryPersonName || "Entregador";
    case "agencia":
      return "Agencia";
    case "referrer":
      return ctx.referrerName || "Referidor";
  }
}

export async function processRemittance(
  input: ProcessRemittanceInput
): Promise<Remittance | null> {
  // 1. Pedido de origen (debe ser una remesa).
  const { data: orderRow, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("*, referrers(full_name)")
    .eq("id", input.orderId)
    .single();
  if (orderErr || !orderRow) throw new Error("Pedido no encontrado");

  const order = orderRow as Order;
  if (order.order_type !== "remittance") throw new Error("El pedido no es una remesa");
  if (!order.country_id) throw new Error("El pedido no tiene país de origen");
  if (!order.amount_origin) throw new Error("El pedido no tiene monto de origen");

  // 2. ¿Ya fue procesada? (order_id es UNIQUE).
  const { data: existing } = await supabaseAdmin
    .from("remittances")
    .select("id")
    .eq("order_id", input.orderId)
    .maybeSingle();
  if (existing) throw new Error("Esta remesa ya fue procesada");

  // 3. País de origen + moneda.
  const { data: country } = await supabaseAdmin
    .from("countries")
    .select("currency_code")
    .eq("id", order.country_id)
    .single();
  const currencyCode = (country?.currency_code ?? order.currency_code)?.toUpperCase();
  if (!currencyCode) throw new Error("El país no tiene moneda configurada");

  const { data: currency } = await supabaseAdmin
    .from("currencies")
    .select("id")
    .eq("code", currencyCode)
    .maybeSingle();

  // 4. Cuenta de recepción (define owner_fee).
  const { data: account } = await supabaseAdmin
    .from("accounts")
    .select("id, name, is_own, owner_fee_percent, owner_name")
    .eq("id", input.accountId)
    .single();
  if (!account) throw new Error("Cuenta no encontrada");

  // 5. Comisiones (%) por país.
  const { data: configs } = await supabaseAdmin
    .from("commission_configs")
    .select("role_type, percent")
    .eq("country_id", order.country_id);
  const byRole: Record<string, number> = {};
  for (const c of configs ?? []) byRole[c.role_type] = Number(c.percent);

  // 6. Tasas de conversión.
  const rateToUsdt = await getRateRow(currencyCode, "USDT");
  if (rateToUsdt == null) throw new Error(`No hay tasa ${currencyCode} → USDT`);

  const deliveryCurrency = input.deliveryCurrency;
  const rateUsdtToDelivery =
    deliveryCurrency === "USD" ? 1 : await getRateRow("USDT", "CUP");
  if (rateUsdtToDelivery == null) throw new Error("No hay tasa USDT → CUP");

  // 7. Nombres para los payouts.
  let deliveryPersonName: string | null = null;
  if (input.deliveryPersonId) {
    const { data: dp } = await supabaseAdmin
      .from("delivery_persons")
      .select("full_name")
      .eq("id", input.deliveryPersonId)
      .maybeSingle();
    deliveryPersonName = dp?.full_name ?? null;
  }
  const referrerName = order.referrers?.full_name ?? null;

  // 8. Cálculo del desglose (§7.1).
  const breakdown = computeRemittance({
    amountOrigin: Number(order.amount_origin),
    rateToUsdt,
    rateUsdtToDelivery,
    deliveryCurrency,
    isOwn: !!account.is_own,
    ownerFeePercent: Number(account.owner_fee_percent ?? 0),
    deliveryPercent: byRole.delivery ?? 0,
    agenciaPercent: byRole.agencia ?? 0,
    referrerPercent: byRole.referrer ?? 0,
    hasReferrer: !!order.referrer_id,
  });

  // 9. Insertar la remesa (snapshots).
  const reference = `REM-${order.id.slice(0, 8).toUpperCase()}`;
  const { data: remittance, error: remErr } = await supabaseAdmin
    .from("remittances")
    .insert({
      order_id: order.id,
      reference,
      country_id: order.country_id,
      currency_id: currency?.id ?? null,
      payment_method_id: order.payment_method_id ?? null,
      account_id: input.accountId,
      delivery_method_id: input.deliveryMethodId ?? null,
      delivery_person_id: input.deliveryPersonId ?? null,
      referrer_id: order.referrer_id ?? null,
      amount_origin: Number(order.amount_origin),
      rate_to_usdt: rateToUsdt,
      usdt_received: breakdown.usdtReceived,
      owner_fee_percent: account.is_own ? 0 : Number(account.owner_fee_percent ?? 0),
      owner_fee_usdt: breakdown.ownerFeeUsdt,
      delivery_currency: deliveryCurrency,
      rate_usdt_to_delivery: rateUsdtToDelivery,
      amount_receive: breakdown.amountReceive,
      beneficiary_name: order.beneficiary_name ?? "",
      beneficiary_phone: order.beneficiary_phone ?? null,
      beneficiary_address: order.beneficiary_address ?? null,
      status: "pendiente_recibo",
      notes: input.notes ?? null,
      created_by: input.createdById ?? null,
    })
    .select()
    .single();

  if (remErr || !remittance) {
    throw new Error(remErr?.message ?? "Error al crear la remesa");
  }

  // 10. Payouts (solo los que generan monto > 0).
  const payoutRows = breakdown.payouts.map((p) => ({
    remittance_id: remittance.id,
    role_type: p.roleType,
    participant_name: participantName(p.roleType, {
      accountName: account.name,
      ownerName: account.owner_name ?? null,
      deliveryPersonName,
      referrerName,
    }),
    percent: p.percent,
    amount_usdt: p.amountUsdt,
  }));

  if (payoutRows.length > 0) {
    const { error: payoutErr } = await supabaseAdmin
      .from("remittance_payouts")
      .insert(payoutRows);
    if (payoutErr) {
      console.error("Error inserting payouts:", payoutErr);
    }
  }

  // 11. El pedido pasa a "procesando".
  await supabaseAdmin
    .from("orders")
    .update({ status: "procesando" })
    .eq("id", order.id);

  return remittance as Remittance;
}

export async function updateRemittanceStatus(
  id: string,
  status: RemittanceStatus
): Promise<Remittance | null> {
  const updates: {
    status: RemittanceStatus;
    updated_at: string;
    received_at?: string;
    delivered_at?: string;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "recibida") updates.received_at = new Date().toISOString();
  if (status === "entregada") updates.delivered_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("remittances")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating remittance status:", error);
    return null;
  }
  return data as Remittance;
}

export async function togglePayoutPaid(id: string): Promise<boolean> {
  const { data: payout } = await supabaseAdmin
    .from("remittance_payouts")
    .select("paid")
    .eq("id", id)
    .single();

  if (!payout) return false;

  const { error } = await supabaseAdmin
    .from("remittance_payouts")
    .update({
      paid: !payout.paid,
      paid_at: payout.paid ? null : new Date().toISOString(),
    })
    .eq("id", id);

  return !error;
}
