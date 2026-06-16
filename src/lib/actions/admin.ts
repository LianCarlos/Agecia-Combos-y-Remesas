'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUserAndProfile } from '@/lib/auth';
import type { Product, MobileRecharge } from '@/types';

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
  revalidatePath('/');
  revalidateTag('currencies');
}
export async function updateCurrencyAction(id: string, name: string, symbol: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('currencies').update({ name, symbol: symbol || '$' }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
  revalidateTag('currencies');
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
  revalidatePath('/');
  revalidateTag('delivery-methods');
}
// Crear/editar con el campo `type` ('cash' | 'transfer'), que la UI usa para
// decidir si el método pide datos bancarios.
export async function createDeliveryMethodWithTypeAction(name: string, type: 'cash' | 'transfer') {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from('delivery_methods')
    .insert({ name, type, active: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/delivery-methods');
  revalidatePath('/');
  revalidateTag('delivery-methods');
  return data;
}
export async function updateDeliveryMethodFullAction(
  id: string,
  data: { name?: string; type?: 'cash' | 'transfer'; active?: boolean }
) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('delivery_methods').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/delivery-methods');
  revalidatePath('/');
  revalidateTag('delivery-methods');
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

/* ═══════════════════════ PRODUCTS ═══════════════════════ */
export interface ProductInput {
  title: string;
  description?: string | null;
  price_usd: number;
  image_url?: string | null;
  active?: boolean;
}

export async function getProductsAction(): Promise<Product[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function createProductAction(input: ProductInput): Promise<Product> {
  await requireAdmin();
  if (!input.title || input.price_usd == null) throw new Error('title y price_usd son requeridos');
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      title: input.title,
      description: input.description ?? null,
      price_usd: input.price_usd,
      image_url: input.image_url ?? null,
      active: input.active ?? true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/combos');
  revalidateTag('products');
  return data as Product;
}

export async function updateProductAction(id: string, input: Partial<ProductInput>): Promise<Product> {
  await requireAdmin();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.price_usd !== undefined) updateData.price_usd = input.price_usd;
  if (input.image_url !== undefined) updateData.image_url = input.image_url;
  if (input.active !== undefined) updateData.active = input.active;
  const { data, error } = await supabaseAdmin
    .from('products')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/combos');
  revalidateTag('products');
  return data as Product;
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/combos');
  revalidateTag('products');
}

/* ═══════════════════════ RECARGAS (mobile_recharges) ═══════════════════════ */
export interface RecargaInput {
  title: string;
  description?: string | null;
  price_usd: number;
  image_url?: string | null;
  active?: boolean;
}

export async function getRecargasAction(): Promise<MobileRecharge[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from('mobile_recharges').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MobileRecharge[];
}

export async function createRecargaAction(input: RecargaInput): Promise<MobileRecharge> {
  await requireAdmin();
  if (!input.title || input.price_usd == null) throw new Error('title y price_usd son requeridos');
  const { data, error } = await supabaseAdmin
    .from('mobile_recharges')
    .insert({
      title: input.title,
      description: input.description ?? null,
      price_usd: input.price_usd,
      image_url: input.image_url ?? null,
      active: input.active ?? true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/recargas');
  revalidateTag('mobile-recharges');
  return data as MobileRecharge;
}

export async function updateRecargaAction(id: string, input: Partial<RecargaInput>): Promise<MobileRecharge> {
  await requireAdmin();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.price_usd !== undefined) updateData.price_usd = input.price_usd;
  if (input.image_url !== undefined) updateData.image_url = input.image_url;
  if (input.active !== undefined) updateData.active = input.active;
  const { data, error } = await supabaseAdmin
    .from('mobile_recharges')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/recargas');
  revalidateTag('mobile-recharges');
  return data as MobileRecharge;
}

export async function deleteRecargaAction(id: string): Promise<void> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('mobile_recharges').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/recargas');
  revalidateTag('mobile-recharges');
}

/* ═══════════════════════ IMAGE UPLOADS (Storage) ═══════════════════════ */
async function uploadImageToStorage(bucket: string, file: File, fallbackPrefix?: string): Promise<string> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `public/${Date.now()}_${safe}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    // Fallback: bucket "combos" con prefijo, si el bucket dedicado no existe
    if (fallbackPrefix) {
      const fallbackName = `${fallbackPrefix}/${Date.now()}_${safe}`;
      const { error: e2 } = await supabaseAdmin.storage.from('combos').upload(fallbackName, buffer, {
        contentType: file.type,
        upsert: false,
      });
      if (e2) throw new Error(e2.message);
      return supabaseAdmin.storage.from('combos').getPublicUrl(fallbackName).data.publicUrl;
    }
    throw new Error(error.message);
  }

  return supabaseAdmin.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
}

export async function uploadComboImageAction(formData: FormData): Promise<string> {
  await requireAdmin();
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file');
  return uploadImageToStorage('combos', file);
}

export async function uploadProductImageAction(formData: FormData): Promise<string> {
  await requireAdmin();
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file');
  return uploadImageToStorage('products', file, 'products');
}

export async function uploadRecargaImageAction(formData: FormData): Promise<string> {
  await requireAdmin();
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file');
  return uploadImageToStorage('recargas', file, 'recargas');
}

/* ═══════════════════════ EXCHANGE RATES (delete) ═══════════════════════ */
export async function deleteExchangeRateAction(paymentMethodId: string, deliveryMethodId: string): Promise<void> {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('exchange_rates')
    .delete()
    .eq('payment_method_id', paymentMethodId)
    .eq('delivery_method_id', deliveryMethodId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/exchange-rates');
  revalidatePath('/');
  revalidateTag('exchange-rates');
}

/* ═══════════════════════ ADMIN INIT (batched) ═══════════════════════ */
export async function getAdminInitDataAction(): Promise<{
  paymentMethods: { id: string; name: string; active: boolean; currency_id: string | null }[];
  deliveryMethods: { id: string; name: string; active: boolean }[];
}> {
  await requireAdmin();
  const [pm, dm] = await Promise.all([
    supabaseAdmin.from('payment_methods').select('id, name, active, currency_id').order('name'),
    supabaseAdmin.from('delivery_methods').select('id, name, active').order('name'),
  ]);
  return {
    paymentMethods: (pm.data ?? []) as { id: string; name: string; active: boolean; currency_id: string | null }[],
    deliveryMethods: (dm.data ?? []) as { id: string; name: string; active: boolean }[],
  };
}

/* ═══════════════════════ SITE SETTINGS (admin password) ═══════════════════════ */
export async function getAdminPasswordStatusAction(): Promise<{ adminPassword: string | null }> {
  await requireAdmin();
  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'admin_password')
    .maybeSingle();
  const hasPassword = data != null && data.value !== '';
  return { adminPassword: hasPassword ? '***' : null };
}

export async function updateAdminPasswordAction(currentPassword: string, newPassword: string): Promise<{ success: true }> {
  await requireAdmin();
  if (!currentPassword?.trim()) throw new Error('La contraseña actual es obligatoria');
  if (!newPassword?.trim()) throw new Error('La nueva contraseña no puede estar vacía');
  if (newPassword.trim().length < 4) throw new Error('La nueva contraseña debe tener al menos 4 caracteres');

  const { data: setting } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'admin_password')
    .maybeSingle();

  const dbPassword = setting?.value ?? '';
  const envPassword = process.env.ADMIN_API_TOKEN ?? '';
  const effectivePassword = dbPassword !== '' ? dbPassword : envPassword;

  if (currentPassword.trim() !== effectivePassword) throw new Error('La contraseña actual es incorrecta');

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ key: 'admin_password', value: newPassword.trim(), updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw new Error('Error al guardar la configuración');
  return { success: true };
}

/* ═══════════════════════ AUTH (logout) ═══════════════════════ */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
