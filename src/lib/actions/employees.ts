'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const serviceClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function createEmployee(email: string, password: string, fullName: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'No autenticado' };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile || profile.role !== 'superadmin') {
    return { success: false, error: 'No autorizado. Solo el superadmin puede crear empleados.' };
  }

  const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) return { success: false, error: createError.message };

  const { error: updateError } = await serviceClient
    .from('profiles')
    .update({ full_name: fullName, role: 'empleado' })
    .eq('id', newUser.user.id);

  if (updateError) return { success: false, error: updateError.message };

  return { success: true, userId: newUser.user.id };
}

export async function updateSuperadminProfile(fullName: string, newPassword?: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'No autenticado' };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile || profile.role !== 'superadmin') {
    return { success: false, error: 'No autorizado' };
  }

  if (fullName.trim()) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', userId);
    if (error) return { success: false, error: error.message };
  }

  if (newPassword?.trim()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getWhatsappPhone(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'whatsapp_phone')
      .single();
    return data?.value || '';
  } catch {
    return '';
  }
}

export async function updateWhatsappPhone(phone: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'No autenticado' };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile || profile.role !== 'superadmin') {
    return { success: false, error: 'No autorizado' };
  }

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ key: 'whatsapp_phone', value: phone.trim() }, { onConflict: 'key' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function revokeEmployeeAccess(employeeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'No autenticado' };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile || profile.role !== 'superadmin') {
    return { success: false, error: 'No autorizado' };
  }

  const { error } = await serviceClient
    .from('profiles')
    .update({ is_active: false })
    .eq('id', employeeId);

  if (error) return { success: false, error: error.message };

  await serviceClient.auth.admin.updateUserById(employeeId, {
    ban_duration: '876600h',
  });

  return { success: true };
}
