import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function authenticatedContext(): Promise<{
  supabase: SupabaseClient;
  user: User | null;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function ownedProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
) {
  const { data, error } = await supabase
    .from("research_projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .maybeSingle();
  return { project: data, error };
}

