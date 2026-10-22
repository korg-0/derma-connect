'use server';

import { createClient } from '@/lib/supabase/server';
import { getProfile, requireUser } from '@/lib/auth';

async function listAllStorageFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  folder: string
): Promise<{ files?: string[]; error?: string }> {
  const files: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from('skin-images')
      .list(folder, { limit: 100, offset });
    if (error) return { error: error.message };
    if (!data?.length) break;

    for (const item of data) {
      const itemPath = `${folder}/${item.name}`;
      if (item.id === null) {
        const nested = await listAllStorageFiles(supabase, itemPath);
        if (nested.error) return nested;
        files.push(...(nested.files ?? []));
      } else {
        files.push(itemPath);
      }
    }

    offset += data.length;
    if (data.length < 100) break;
  }

  return { files };
}

export async function deleteOwnPatientAccount() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (profile?.role !== 'patient') {
    return { success: false, error: 'This account cannot be deleted from patient settings.' };
  }

  const supabase = await createClient();
  const listed = await listAllStorageFiles(supabase, user.id);
  if (listed.error) {
    return { success: false, error: `Could not prepare image deletion: ${listed.error}` };
  }

  const files = listed.files ?? [];
  for (let offset = 0; offset < files.length; offset += 100) {
    const { error } = await supabase.storage
      .from('skin-images')
      .remove(files.slice(offset, offset + 100));
    if (error) {
      return { success: false, error: `Could not delete uploaded images: ${error.message}` };
    }
  }

  const { error } = await supabase.rpc('delete_own_patient_account');
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
