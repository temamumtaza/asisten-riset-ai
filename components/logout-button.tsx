"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button className="button button-quiet" type="button" onClick={logout} disabled={loading}>
      <LogOut size={15} aria-hidden="true" />
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}

