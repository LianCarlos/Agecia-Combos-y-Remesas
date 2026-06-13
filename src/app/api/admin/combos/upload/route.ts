import { supabaseAdmin } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth';
import { type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return Response.json({ error: 'No file' }, { status: 400 });
  }

  const fileName = `public/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage.from('combos').upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from('combos').getPublicUrl(fileName);
  return Response.json({ url: publicUrl });
}
