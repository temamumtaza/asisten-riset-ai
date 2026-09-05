import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<{
  user: User | null;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { user, supabase };
}

