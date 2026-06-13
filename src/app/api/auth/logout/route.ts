import { createClient } from '@/lib/supabase/server';
import { type NextRequest } from 'next/server';

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return Response.json({ success: true });
}
