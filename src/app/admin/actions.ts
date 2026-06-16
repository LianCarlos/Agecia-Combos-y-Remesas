'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserAndProfile } from '@/lib/auth';
import {
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '@/lib/services/payment-methods';
import {
  getAllDeliveryMethods,
  createDeliveryMethod,
  updateDeliveryMethod,
  deleteDeliveryMethod,
} from '@/lib/services/delivery-methods';
import {
  getRateMatrix,
} from '@/lib/services/exchange-rates';
import {
  getAllCombos,
  createCombo,
  updateCombo,
  deleteCombo,
} from '@/lib/services/combos';
import type { CreateComboData, UpdateComboData } from '@/lib/services/combos';
import {
  getAllProfiles,
  updateProfile,
} from '@/lib/services/profiles';
import type { PaymentMethod, DeliveryMethod, Combo, Profile } from '@/types';

/* ─── Auth Guard ─── */

async function requireAdmin(): Promise<Profile> {
  const result = await getCurrentUserAndProfile();
  if (!result?.profile) throw new Error('No autenticado');
  const { profile } = result;
  if (profile.role !== 'superadmin' && profile.role !== 'empleado') {
    throw new Error('No autorizado. Se requiere rol de administrador.');
  }
  return profile;
}

async function requireSuperAdmin(): Promise<Profile> {
  const profile = await requireAdmin();
  if (profile.role !== 'superadmin') {
    throw new Error('No autorizado. Solo el superadmin puede realizar esta acción.');
  }
  return profile;
}

/* ─── Payment Methods ─── */

export async function getPaymentMethodsServerAction(): Promise<PaymentMethod[]> {
  await requireAdmin();
  return getAllPaymentMethods();
}

export async function createPaymentMethodServerAction(name: string, currencyId?: string): Promise<PaymentMethod | null> {
  await requireAdmin();
  const result = await createPaymentMethod(name, currencyId || '');
  revalidatePath('/admin/payment-methods');
  revalidatePath('/admin');
  return result;
}

export async function updatePaymentMethodServerAction(
  id: string,
  name: string,
  active: boolean,
  currencyId?: string | null
): Promise<PaymentMethod | null> {
  await requireAdmin();
  const result = await updatePaymentMethod(id, name, active, currencyId);
  revalidatePath('/admin/payment-methods');
  revalidatePath('/admin');
  return result;
}

export async function deletePaymentMethodServerAction(id: string): Promise<boolean> {
  await requireAdmin();
  const result = await deletePaymentMethod(id);
  revalidatePath('/admin/payment-methods');
  revalidatePath('/admin');
  return result;
}

/* ─── Delivery Methods ─── */

export async function getDeliveryMethodsServerAction(): Promise<DeliveryMethod[]> {
  await requireAdmin();
  return getAllDeliveryMethods();
}

export async function createDeliveryMethodServerAction(name: string): Promise<DeliveryMethod | null> {
  await requireAdmin();
  const result = await createDeliveryMethod(name);
  revalidatePath('/admin/delivery-methods');
  revalidatePath('/admin');
  return result;
}

export async function updateDeliveryMethodServerAction(
  id: string,
  name: string,
  active: boolean
): Promise<DeliveryMethod | null> {
  await requireAdmin();
  const result = await updateDeliveryMethod(id, name, active);
  revalidatePath('/admin/delivery-methods');
  revalidatePath('/admin');
  return result;
}

export async function deleteDeliveryMethodServerAction(id: string): Promise<boolean> {
  await requireAdmin();
  const result = await deleteDeliveryMethod(id);
  revalidatePath('/admin/delivery-methods');
  revalidatePath('/admin');
  return result;
}

/* ─── Exchange Rates ─── */

export async function getRateMatrixServerAction() {
  await requireAdmin();
  return getRateMatrix();
}

/* ─── Combos ─── */

export async function getCombosServerAction(): Promise<Combo[]> {
  await requireAdmin();
  return getAllCombos();
}

export async function createComboServerAction(data: CreateComboData): Promise<Combo | null> {
  await requireAdmin();
  const result = await createCombo(data);
  revalidatePath('/admin/combos');
  revalidatePath('/admin');
  return result;
}

export async function updateComboServerAction(id: string, data: UpdateComboData): Promise<Combo | null> {
  await requireAdmin();
  const result = await updateCombo(id, data);
  revalidatePath('/admin/combos');
  revalidatePath('/admin');
  return result;
}

export async function deleteComboServerAction(id: string): Promise<boolean> {
  await requireAdmin();
  const result = await deleteCombo(id);
  revalidatePath('/admin/combos');
  revalidatePath('/admin');
  return result;
}

/* ─── Profiles (Employees) ─── */

export async function getProfilesServerAction(): Promise<Profile[]> {
  await requireSuperAdmin();
  return getAllProfiles();
}

export async function updateProfileServerAction(
  id: string,
  data: { full_name?: string | null; is_active?: boolean }
): Promise<Profile | null> {
  await requireAdmin();
  const result = await updateProfile(id, data);
  revalidatePath('/admin/employees');
  revalidatePath('/admin');
  return result;
}

