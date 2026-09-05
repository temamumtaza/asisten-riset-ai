"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function GoogleSignInButton() {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function signIn() {
    setState("loading");
    setMessage("");
    let timeoutId: number | undefined;
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo =
        window.location.origin + "/auth/callback?next=" + encodeURIComponent("/workspace");
      const oauthRequest = supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true }
      });
      const authFlow = (async () => {
        const { data, error } = await oauthRequest;
        if (error) throw error;
        if (!data.url) throw new Error("OAuth URL missing");

        const probe = await fetch(data.url, {
          credentials: "omit",
          cache: "no-store",
          redirect: "manual"
        });
        const isRedirect = probe.status >= 300 && probe.status < 400;
        if (!probe.ok && !isRedirect && probe.status !== 0) {
          throw new Error("OAuth provider unavailable");
        }
        window.location.assign(data.url);
      })();
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error("OAuth timeout")), 12_000);
      });
      await Promise.race([authFlow, timeout]);
    } catch {
      setState("error");
      setMessage("Login belum siap. Periksa konfigurasi Supabase dan Google OAuth.");
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
  }

  return (
    <div className="auth-form">
      <button className="button button-primary" type="button" onClick={signIn} disabled={state === "loading"}>
        <LogIn size={17} aria-hidden="true" />
        {state === "loading" ? "Membuka login..." : "Masuk dengan Google"}
      </button>
      <p className="field-help">
        Hanya Google yang digunakan. Tidak ada kata sandi yang disimpan aplikasi ini.
      </p>
      {message ? (
        <p className="status-message" data-tone="error" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
