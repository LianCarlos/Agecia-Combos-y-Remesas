"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { REFERRAL_COOKIE, resolveByCode } from "@/lib/services/referrers";
import {
  insertOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  type OrderFilters,
} from "@/lib/services/orders";
import { getCurrentUserAndProfile } from "@/lib/auth";
import type { CreateOrderInput, Order, OrderStatus, Profile } from "@/types";

// ============================================================================
// Acciones de pedidos
// ----------------------------------------------------------------------------
// - `createOrder`: PÚBLICA. La invocan los checkout del sitio (remesa, carrito,
//   recarga). Registra el pedido y lo atribuye al referido de la cookie.
// - `getOrdersAction` / `getOrderAction` / `updateOrderStatusAction`: ADMIN.
//   Gestionan los pedidos entrantes (filtros, detalle y cambio de estado).
// ============================================================================

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  referrerResolved?: boolean;
}

const ALLOWED_ORDER_TYPES = ["remittance", "combo", "product", "recharge", "cart"];
const ALLOWED_ORDER_STATUSES = ["nuevo", "procesando", "completado", "cancelado"];

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

/* ═══════════════════════════ PÚBLICA: createOrder ═══════════════════════════ */

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  // Validación ligera: el tipo de pedido es obligatorio y acotado.
  if (!input.order_type || !ALLOWED_ORDER_TYPES.includes(input.order_type)) {
    return { success: false };
  }

  // Atribución de referido desde la cookie (nunca desde el payload del cliente).
  let referrerId: string | null = null;
  let referralCode: string | null = null;
  try {
    const cookieStore = await cookies();
    const code = cookieStore.get(REFERRAL_COOKIE)?.value;
    if (code) {
      const referrer = await resolveByCode(code);
      if (referrer) {
        referrerId = referrer.id;
        referralCode = referrer.referral_code;
      }
    }
  } catch (error) {
    // Sin cookie o sin acceso a headers: el pedido sigue sin atribución.
    console.error("Error resolviendo referido desde la cookie:", error);
  }

  const order = await insertOrder(input, {
    referrer_id: referrerId,
    referral_code: referralCode,
  });

  if (!order) {
    return { success: false };
  }

  return { success: true, orderId: order.id, referrerResolved: !!referrerId };
}

/* ═══════════════════════════ ADMIN: pedidos ═══════════════════════════ */

export async function getOrdersAction(filters: OrderFilters = {}): Promise<Order[]> {
  await requireAdmin();
  return getOrders(filters);
}

export async function getOrderAction(id: string): Promise<Order | null> {
  await requireAdmin();
  return getOrder(id);
}

export async function updateOrderStatusAction(
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  await requireAdmin();
  if (!ALLOWED_ORDER_STATUSES.includes(status)) throw new Error("Estado no válido");
  const result = await updateOrderStatus(id, status);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/remittances");
  revalidatePath("/admin");
  return result;
}
