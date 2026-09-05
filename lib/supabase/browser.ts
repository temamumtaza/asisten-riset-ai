"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

let client: SupabaseClient | undefined;

export function createBrowserSupabaseClient() {
  if (client) return client;
  const { url, publishableKey } = getSupabaseEnv();
  client = createBrowserClient(url, publishableKey);
  return client;
}

