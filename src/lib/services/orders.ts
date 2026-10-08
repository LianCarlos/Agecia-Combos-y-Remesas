import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CreateOrderInput, Order, OrderStatus } from "@/types";

// ============================================================================
// Pedidos — persistencia pública de pedidos entrantes (migración 008)
// ============================================================================
// La inserción usa la service-role key (supabaseAdmin): los pedidos los crea
// el público (sin sesión) y la RLS de `orders`/`order_items` es admin-only.
// La validación de permisos NO aplica aquí: es una acción pública deliberada.
// ============================================================================

export interface InsertOrderOptions {
  referrer_id?: string | null;
  referral_code?: string | null;
}

/**
 * Inserta un pedido y, para `order_type = 'cart'`, sus ítems en `order_items`.
 * Devuelve el pedido creado o null si falla. No es `cache`: es una escritura.
 */
export async function insertOrder(
  input: CreateOrderInput,
  options: InsertOrderOptions = {}
): Promise<Order | null> {
  const { items, ...orderRow } = input;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      ...orderRow,
      referrer_id: options.referrer_id ?? null,
      referral_code: options.referral_code ?? null,
      // El pedido se registra al abrir el enlace de WhatsApp.
      whatsapp_sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !order) {
    console.error("Error inserting order:", error);
    return null;
  }

  if (items && items.length > 0) {
    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(items.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) {
      // El pedido ya quedó guardado; el fallo de ítems se registra sin romper.
      console.error("Error inserting order items:", itemsError);
    }
  }

  return order as Order;
}

// ============================================================================
// Lectura y gestión de pedidos (admin) — migración 008
// ============================================================================

export interface OrderFilters {
  orderType?: string;
  status?: string;
}

const ORDERS_SELECT = `*, countries(name, flag_icon), referrers(full_name), order_items(*)`;

export async function getOrders(filters: OrderFilters = {}): Promise<Order[]> {
  let query = supabaseAdmin
    .from("orders")
    .select(ORDERS_SELECT)
    .order("created_at", { ascending: false });

  if (filters.orderType) query = query.eq("order_type", filters.orderType);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return (data ?? []) as Order[];
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(ORDERS_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating order status:", error);
    return null;
  }
  return data as Order;
}
