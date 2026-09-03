import { supabaseAdmin } from '@/lib/supabase/admin';
import type { WholesaleRate } from '@/types';

export async function getActiveWholesaleRates(): Promise<WholesaleRate[]> {
  const { data } = await supabaseAdmin
    .from('wholesale_rates')
    .select('*, payment_methods(id, name)')
    .eq('active', true)
    .order('payment_method_id')
    .order('min_amount', { ascending: true });
  return (data ?? []) as WholesaleRate[];
}
