function required(name: string, value: string | undefined) {
  if (
    !value ||
    value === "your-project.supabase.co" ||
    value === "your-supabase-publishable-key"
  ) {
    throw new Error("MISSING_ENV_" + name);
  }
  return value;
}

export function getSupabaseEnv() {
  return {
    url: required("SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    publishableKey: required(
      "SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  };
}

export function getSumopodConfig() {
  const apiKey = process.env.SUMOPOD_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: (process.env.SUMOPOD_BASE_URL ?? "https://ai.sumopod.com/v1/").replace(/\/+$/, ""),
    model: process.env.SUMOPOD_MODEL ?? "gemini/gemini-3.1-flash-lite"
  };
}

