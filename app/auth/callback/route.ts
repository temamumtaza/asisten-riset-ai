import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/workspace";
  return value;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Kode+login+tidak+ditemukan", request.url));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=Kode+login+tidak+valid", request.url));
    }
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=Login+belum+siap+dikonfigurasi", request.url));
  }
}

