'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUserAndProfile } from '@/lib/auth';

async function requireAdmin() {
  const result = await getCurrentUserAndProfile();
  if (!result?.profile) throw new Error('No autenticado');
  const { profile } = result;
  if (profile.role !== 'superadmin' && profile.role !== 'empleado') {
    throw new Error('No autorizado');
  }
  return profile;
}

/* ═══════════════════════════════════════════════════════
   FALLBACK GLOBAL: Cotizador público
   ═══════════════════════════════════════════════════════ */

export async function getAvailableRatesAction(detectedCurrencyCode?: string) {
  let query = supabaseAdmin
    .from('exchange_rates')
    .select(`
      payment_method_id, delivery_method_id, rate, updated_at,
      payment_methods!inner(id, name, active, currency_id, currencies!inner(id, code, symbol)),
      delivery_methods!inner(id, name, active)
    `);

  if (detectedCurrencyCode) {
    const { data: currency } = await supabaseAdmin
      .from('currencies').select('id').eq('code', detectedCurrencyCode.toUpperCase()).eq('active', true).maybeSingle();
    if (currency) {
      query = supabaseAdmin.from('exchange_rates').select(`
        payment_method_id, delivery_method_id, rate, updated_at,
        payment_methods!inner(id, name, active, currency_id, currencies!inner(id, code, symbol)),
        delivery_methods!inner(id, name, active)
      `).eq('payment_methods.currency_id', currency.id);
    }
  }

  const { data, error } = await query.eq('delivery_methods.active', true).order('rate', { ascending: false });
  if (error) { console.error('Error getAvailableRates:', error); return []; }

  return (data as any[]).map(row => ({
    paymentMethodId: row.payment_method_id,
    deliveryMethodId: row.delivery_method_id,
    paymentMethod: row.payment_methods?.name ?? 'Desconocido',
    deliveryMethod: row.delivery_methods?.name ?? 'Desconocido',
    currencyCode: row.payment_methods?.currencies?.code ?? 'USD',
    currencySymbol: row.payment_methods?.currencies?.symbol ?? '$',
    rate: row.rate,
    updatedAt: row.updated_at,
  }));
}

/* ═══════════════════════ TASAS INLINE ═══════════════════ */
export async function updateExchangeRateInlineAction(pmId: string, dmId: string, rate: number) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('exchange_rates').upsert({
    payment_method_id: pmId, delivery_method_id: dmId, rate, updated_at: new Date().toISOString()
  }, { onConflict: 'payment_method_id,delivery_method_id' });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/exchange-rates');
  return { success: true };
}

/* ═══════════════════════ CURRENCIES ═══════════════════════ */
export async function createCurrencyAction(code: string, name: string, symbol: string) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from('currencies').insert({ code: code.toUpperCase(), name, symbol }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  return data;
}
export async function toggleCurrencyAction(id: string) {
  await requireAdmin();
  const { data: c } = await supabaseAdmin.from('currencies').select('active').eq('id', id).single();
  await supabaseAdmin.from('currencies').update({ active: !c?.active }).eq('id', id);
  revalidatePath('/admin');
}
export async function deleteCurrencyAction(id: string) {
  await requireAdmin();
  await supabaseAdmin.from('currencies').delete().eq('id', id);
  revalidatePath('/admin');
}
export async function getCurrenciesAction() {
  const { data } = await supabaseAdmin.from('currencies').select('*').eq('active', true).order('code');
  return data ?? [];
}
export async function getAllCurrenciesAction() {
  await requireAdmin();
  const { data } = await supabaseAdmin.from('currencies').select('*').order('code');
  return data ?? [];
}

/* ═══════════════════════ PAYMENT METHODS ═════════════════ */
export async function createPaymentMethodAction(name: string, currencyId: string) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from('payment_methods').insert({ name, currency_id: currencyId, active: true }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/payment-methods');
  return data;
}
export async function togglePaymentMethodAction(id: string) {
  await requireAdmin();
  const { data: pm } = await supabaseAdmin.from('payment_methods').select('active').eq('id', id).single();
  await supabaseAdmin.from('payment_methods').update({ active: !pm?.active }).eq('id', id);
  revalidatePath('/admin/payment-methods');
}
export async function deletePaymentMethodAction(id: string) {
  await requireAdmin();
  await supabaseAdmin.from('payment_methods').delete().eq('id', id);
  revalidatePath('/admin/payment-methods');
}

/* ═══════════════════════ DELIVERY METHODS ════════════════ */
export async function createDeliveryMethodAction(name: string) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from('delivery_methods').insert({ name, active: true }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/delivery-methods');
  return data;
}
export async function toggleDeliveryMethodAction(id: string) {
  await requireAdmin();
  const { data: dm } = await supabaseAdmin.from('delivery_methods').select('active').eq('id', id).single();
  await supabaseAdmin.from('delivery_methods').update({ active: !dm?.active }).eq('id', id);
  revalidatePath('/admin/delivery-methods');
}
export async function deleteDeliveryMethodAction(id: string) {
  await requireAdmin();
  await supabaseAdmin.from('delivery_methods').delete().eq('id', id);
  revalidatePath('/admin/delivery-methods');
}

/* ═══════════════════════ COMBOS ═══════════════════════════ */
export async function createComboAction(data: { title: string; description?: string | null; price_usd: number; image_url?: string | null }) {
  await requireAdmin();
  const { data: combo, error } = await supabaseAdmin.from('combos').insert({ ...data, available: true }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/combos');
  return combo;
}
export async function updateComboAction(id: string, data: Record<string, unknown>) {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabaseAdmin.from('combos').update(data as any).eq('id', id);
  revalidatePath('/admin/combos');
}
export async function toggleComboStatusAction(id: string) {
  await requireAdmin();
  const { data: c } = await supabaseAdmin.from('combos').select('available').eq('id', id).single();
  await supabaseAdmin.from('combos').update({ available: !c?.available }).eq('id', id);
  revalidatePath('/admin/combos');
}
export async function duplicateComboAction(id: string) {
  await requireAdmin();
  const { data: orig } = await supabaseAdmin.from('combos').select('*').eq('id', id).single();
  if (!orig) throw new Error('Combo no encontrado');
  const { id: _, created_at, updated_at, ...rest } = orig;
  await supabaseAdmin.from('combos').insert({ ...rest, title: `${orig.title} (Copia)`, available: true });
  revalidatePath('/admin/combos');
}
export async function deleteComboAction(id: string) {
  await requireAdmin();
  await supabaseAdmin.from('combos').delete().eq('id', id);
  revalidatePath('/admin/combos');
}

/* ═══════════════════════ EMPLOYEES ═══════════════════════ */
export async function createEmployeeAction(email: string, password: string) {
  const profile = await requireAdmin();
  if (profile.role !== 'superadmin') throw new Error('Solo superadmin');
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/employees');
  return data;
}
export async function toggleEmployeeAction(id: string) {
  await requireAdmin();
  const { data: p } = await supabaseAdmin.from('profiles').select('is_active').eq('id', id).single();
  await supabaseAdmin.from('profiles').update({ is_active: !p?.is_active }).eq('id', id);
  revalidatePath('/admin/employees');
}
export async function getEmployeesAction() {
  await requireAdmin();
  const { data } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
  return data ?? [];
}
