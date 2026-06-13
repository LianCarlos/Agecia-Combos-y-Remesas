import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { Profile } from "@/types";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  console.log('[TRACE] 🟫 profiles.ts getCurrentProfile() → ⚠️ LLAMANDO supabase.auth.getUser() (Auth API)');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[TRACE] 🟫 profiles.ts getCurrentProfile() → auth.getUser() resultado:', user ? user.id : 'NULL');

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    console.error("Error fetching current profile:", error);
    return null;
  }

  return data as Profile;
});

export const getAllProfiles = cache(async (): Promise<Profile[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all profiles:", error);
    return [];
  }

  return data as Profile[];
});

export interface UpdateProfileData {
  email?: string | null;
  full_name?: string | null;
  role?: "superadmin" | "empleado";
  is_active?: boolean;
}

export async function updateProfile(
  id: string,
  data: UpdateProfileData
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return profile as Profile;
}
