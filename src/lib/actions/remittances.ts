"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserAndProfile } from "@/lib/auth";
import {
  getRemittances,
  getRemittance,
  getPendingRemittanceOrders,
  processRemittance,
  updateRemittanceStatus,
  togglePayoutPaid,
  type ProcessRemittanceInput,
} from "@/lib/services/remittances";
import type {
  DeliveryCurrency,
  Profile,
  Remittance,
  RemittanceStatus,
} from "@/types";

// ============================================================================
// Acciones admin de remesas (migración 008)
// ----------------------------------------------------------------------------
// Tablas operativas: cualquier admin (empleado + superadmin) lee y escribe.
// El procesamiento calcula en vivo el desglose (§7.1) y crea remittance + payouts.
// ============================================================================

const ALLOWED_REMITTANCE_STATUSES = [
  "pendiente_recibo",
  "recibida",
  "en_reparto",
  "entregada",
  "cancelada",
];

async function requireAdmin(): Promise<Profile> {
  const result = await getCurrentUserAndProfile();
  if (!result?.profile) throw new Error("No autenticado");
  const { profile } = result;
  if (!profile.is_active) throw new Error("Cuenta desactivada");
  if (profile.role !== "superadmin" && profile.role !== "empleado") {
    throw new Error("No autorizado. Se requiere rol de administrador.");
  }
  return profile;
}

/* ─── Lectura ─── */

export async function getRemittancesAction(): Promise<Remittance[]> {
  await requireAdmin();
  return getRemittances();
}

export async function getRemittanceAction(id: string): Promise<Remittance | null> {
  await requireAdmin();
  return getRemittance(id);
}

export async function getPendingRemittanceOrdersAction() {
  await requireAdmin();
  return getPendingRemittanceOrders();
}

/** Opciones para el formulario de procesar (cuentas, entregadores, canales). */
export async function getRemittanceFormOptionsAction(): Promise<{
  accounts: { id: string; name: string; is_own: boolean; owner_fee_percent: number }[];
  deliveryPersons: { id: string; full_name: string }[];
  deliveryMethods: { id: string; name: string; type: string | null }[];
}> {
  await requireAdmin();
  const [accounts, persons, methods] = await Promise.all([
    supabaseAdmin
      .from("accounts")
      .select("id, name, is_own, owner_fee_percent")
      .eq("is_active", true)
      .order("name"),
    supabaseAdmin
      .from("delivery_persons")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
    supabaseAdmin
      .from("delivery_methods")
      .select("id, name, type")
      .eq("active", true)
      .order("name"),
  ]);

  return {
    accounts: (accounts.data ?? []) as {
      id: string;
      name: string;
      is_own: boolean;
      owner_fee_percent: number;
    }[],
    deliveryPersons: (persons.data ?? []) as { id: string; full_name: string }[],
    deliveryMethods: (methods.data ?? []) as {
      id: string;
      name: string;
      type: string | null;
    }[],
  };
}

/* ─── Procesar ─── */

export async function processRemittanceAction(input: {
  orderId: string;
  accountId: string;
  deliveryPersonId?: string | null;
  deliveryMethodId?: string | null;
  deliveryCurrency: DeliveryCurrency;
  notes?: string | null;
}): Promise<Remittance | null> {
  const profile = await requireAdmin();
  if (!input.orderId) throw new Error("Falta el pedido");
  if (!input.accountId) throw new Error("Selecciona una cuenta de recepción");
  if (input.deliveryCurrency !== "CUP" && input.deliveryCurrency !== "USD") {
    throw new Error("Moneda de entrega no válida");
  }

  const payload: ProcessRemittanceInput = {
    ...input,
    createdById: profile.id,
  };
  const remittance = await processRemittance(payload);

  revalidatePath("/admin/remittances");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return remittance;
}

/* ─── Estados y pagos ─── */

export async function updateRemittanceStatusAction(
  id: string,
  status: RemittanceStatus
): Promise<Remittance | null> {
  await requireAdmin();
  if (!ALLOWED_REMITTANCE_STATUSES.includes(status)) throw new Error("Estado no válido");
  const result = await updateRemittanceStatus(id, status);
  revalidatePath("/admin/remittances");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return result;
}

export async function togglePayoutPaidAction(id: string): Promise<boolean> {
  await requireAdmin();
  const result = await togglePayoutPaid(id);
  revalidatePath("/admin/remittances");
  revalidatePath("/admin");
  return result;
}
