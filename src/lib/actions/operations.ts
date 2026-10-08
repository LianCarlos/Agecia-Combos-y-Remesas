'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserAndProfile } from '@/lib/auth';
import type { Profile, AccountType, CommissionRoleType } from '@/types';

// ============================================================================
// Acciones de configuración operativa (migración 008)
// ----------------------------------------------------------------------------
// Lectura: cualquier admin (empleado + superadmin) — coincide con la RLS
// "SELECT TO authenticated USING is_admin()".
// Escritura: SOLO superadmin — coincide con la RLS "ALL TO authenticated
// USING is_superadmin()". requireSuperAdmin lo refuerza en el servidor.
// ============================================================================

// ── Servicios (Fase 3) ──
import {
  getAllConversionRates,
  upsertRate,
  deleteRate,
} from '@/lib/services/conversion-rates';
import {
  getAllCountries,
  createCountry,
  updateCountry,
  toggleCountry,
  deleteCountry,
} from '@/lib/services/countries';
import type { CreateCountryData, UpdateCountryData } from '@/lib/services/countries';
import {
  getAllAccounts,
  createAccount,
  updateAccount,
  toggleAccount,
  deleteAccount,
} from '@/lib/services/accounts';
import type { CreateAccountData, UpdateAccountData } from '@/lib/services/accounts';
import {
  getAllDeliveryPersons,
  createDeliveryPerson,
  updateDeliveryPerson,
  toggleDeliveryPerson,
  deleteDeliveryPerson,
} from '@/lib/services/delivery-persons';
import type { CreateDeliveryPersonData, UpdateDeliveryPersonData } from '@/lib/services/delivery-persons';
import {
  getCommissionConfigs,
  upsertCommissionConfig,
  deleteCommissionConfig,
} from '@/lib/services/commission-configs';
import {
  getAllReferrers,
  createReferrer,
  updateReferrer,
  toggleReferrer,
  deleteReferrer,
} from '@/lib/services/referrers';
import type { CreateReferrerData, UpdateReferrerData } from '@/lib/services/referrers';

/* ─── Guards ─── */

async function requireAdmin(): Promise<Profile> {
  const result = await getCurrentUserAndProfile();
  if (!result?.profile) throw new Error('No autenticado');
  const { profile } = result;
  if (!profile.is_active) throw new Error('Cuenta desactivada');
  if (profile.role !== 'superadmin' && profile.role !== 'empleado') {
    throw new Error('No autorizado. Se requiere rol de administrador.');
  }
  return profile;
}

async function requireSuperAdmin(): Promise<Profile> {
  const profile = await requireAdmin();
  if (profile.role !== 'superadmin') {
    throw new Error('No autorizado. Solo el superadmin puede gestionar la configuración.');
  }
  return profile;
}

/* ─── Tasas de conversión (USDT pivote) ─── */

export async function getConversionRatesServerAction() {
  await requireAdmin();
  return getAllConversionRates();
}

export async function upsertConversionRateServerAction(
  fromCode: string,
  toCode: string,
  rate: number
) {
  await requireSuperAdmin();
  if (!fromCode.trim() || !toCode.trim()) throw new Error('Códigos de moneda requeridos');
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('La tasa debe ser mayor a 0');
  const result = await upsertRate(fromCode.trim(), toCode.trim(), rate);
  revalidatePath('/admin/conversion-rates');
  revalidatePath('/admin');
  return result;
}

export async function deleteConversionRateServerAction(id: string) {
  await requireSuperAdmin();
  const result = await deleteRate(id);
  revalidatePath('/admin/conversion-rates');
  revalidatePath('/admin');
  return result;
}

/* ─── Países de origen ─── */

export async function getCountriesServerAction() {
  await requireAdmin();
  return getAllCountries();
}

export async function createCountryServerAction(data: CreateCountryData) {
  await requireSuperAdmin();
  if (!data.name.trim()) throw new Error('El nombre del país es requerido');
  const result = await createCountry({ ...data, name: data.name.trim() });
  revalidatePath('/admin/countries');
  revalidatePath('/admin');
  revalidatePath('/');
  return result;
}

export async function updateCountryServerAction(id: string, data: UpdateCountryData) {
  await requireSuperAdmin();
  const result = await updateCountry(id, data);
  revalidatePath('/admin/countries');
  revalidatePath('/admin');
  revalidatePath('/');
  return result;
}

export async function toggleCountryServerAction(id: string) {
  await requireSuperAdmin();
  const result = await toggleCountry(id);
  revalidatePath('/admin/countries');
  revalidatePath('/admin');
  revalidatePath('/');
  return result;
}

export async function deleteCountryServerAction(id: string) {
  await requireSuperAdmin();
  const result = await deleteCountry(id);
  revalidatePath('/admin/countries');
  revalidatePath('/admin');
  revalidatePath('/');
  return result;
}

/* ─── Cuentas de recepción ─── */

export async function getAccountsServerAction() {
  await requireAdmin();
  return getAllAccounts();
}

export async function createAccountServerAction(data: CreateAccountData) {
  await requireSuperAdmin();
  if (!data.name.trim()) throw new Error('El nombre de la cuenta es requerido');
  const result = await createAccount({ ...data, name: data.name.trim() });
  revalidatePath('/admin/accounts');
  revalidatePath('/admin');
  return result;
}

export async function updateAccountServerAction(id: string, data: UpdateAccountData) {
  await requireSuperAdmin();
  const result = await updateAccount(id, data);
  revalidatePath('/admin/accounts');
  revalidatePath('/admin');
  return result;
}

export async function toggleAccountServerAction(id: string) {
  await requireSuperAdmin();
  const result = await toggleAccount(id);
  revalidatePath('/admin/accounts');
  revalidatePath('/admin');
  return result;
}

export async function deleteAccountServerAction(id: string) {
  await requireSuperAdmin();
  const result = await deleteAccount(id);
  revalidatePath('/admin/accounts');
  revalidatePath('/admin');
  return result;
}

/* ─── Repartidores ─── */

export async function getDeliveryPersonsServerAction() {
  await requireAdmin();
  return getAllDeliveryPersons();
}

export async function createDeliveryPersonServerAction(data: CreateDeliveryPersonData) {
  await requireSuperAdmin();
  if (!data.full_name.trim()) throw new Error('El nombre del repartidor es requerido');
  const result = await createDeliveryPerson({ ...data, full_name: data.full_name.trim() });
  revalidatePath('/admin/delivery-persons');
  revalidatePath('/admin');
  return result;
}

export async function updateDeliveryPersonServerAction(id: string, data: UpdateDeliveryPersonData) {
  await requireSuperAdmin();
  const result = await updateDeliveryPerson(id, data);
  revalidatePath('/admin/delivery-persons');
  revalidatePath('/admin');
  return result;
}

export async function toggleDeliveryPersonServerAction(id: string) {
  await requireSuperAdmin();
  const result = await toggleDeliveryPerson(id);
  revalidatePath('/admin/delivery-persons');
  revalidatePath('/admin');
  return result;
}

export async function deleteDeliveryPersonServerAction(id: string) {
  await requireSuperAdmin();
  const result = await deleteDeliveryPerson(id);
  revalidatePath('/admin/delivery-persons');
  revalidatePath('/admin');
  return result;
}

/* ─── Comisiones (%) por país ─── */

export async function getCommissionsServerAction() {
  await requireAdmin();
  return getCommissionConfigs();
}

export async function upsertCommissionServerAction(
  countryId: string,
  roleType: CommissionRoleType,
  percent: number
) {
  await requireSuperAdmin();
  if (!countryId) throw new Error('Selecciona un país');
  if (!Number.isFinite(percent) || percent < 0) throw new Error('El porcentaje no puede ser negativo');
  const result = await upsertCommissionConfig(countryId, roleType, percent);
  revalidatePath('/admin/commissions');
  revalidatePath('/admin');
  return result;
}

export async function deleteCommissionServerAction(id: string) {
  await requireSuperAdmin();
  const result = await deleteCommissionConfig(id);
  revalidatePath('/admin/commissions');
  revalidatePath('/admin');
  return result;
}

/* ─── Referidores ─── */

export async function getReferrersServerAction() {
  await requireAdmin();
  return getAllReferrers();
}

export async function createReferrerServerAction(data: CreateReferrerData) {
  await requireSuperAdmin();
  if (!data.full_name.trim()) throw new Error('El nombre del referidor es requerido');
  if (!data.referral_code.trim()) throw new Error('El código de referido es requerido');
  const result = await createReferrer({ ...data, full_name: data.full_name.trim() });
  revalidatePath('/admin/referrers');
  revalidatePath('/admin');
  return result;
}

export async function updateReferrerServerAction(id: string, data: UpdateReferrerData) {
  await requireSuperAdmin();
  const result = await updateReferrer(id, data);
  revalidatePath('/admin/referrers');
  revalidatePath('/admin');
  return result;
}

export async function toggleReferrerServerAction(id: string) {
  await requireSuperAdmin();
  const result = await toggleReferrer(id);
  revalidatePath('/admin/referrers');
  revalidatePath('/admin');
  return result;
}

export async function deleteReferrerServerAction(id: string) {
  await requireSuperAdmin();
  const result = await deleteReferrer(id);
  revalidatePath('/admin/referrers');
  revalidatePath('/admin');
  return result;
}
