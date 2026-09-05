import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ConfigurationState } from "@/components/configuration-state";
import { WorkspaceNav, WorkspaceSidebar } from "@/components/workspace-nav";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function loadUser() {
  try {
    return { value: await getCurrentUser(), configurationError: false };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("MISSING_ENV_")) {
      return { value: null, configurationError: true };
    }
    throw error;
  }
}

function displayName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const name = metadata?.full_name ?? metadata?.name;
  return typeof name === "string" && name.trim() ? name.trim() : "Peneliti";
}

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const result = await loadUser();
  if (result.configurationError) return <ConfigurationState />;
  const user = result.value?.user;
  if (!user) redirect("/login");

  return (
    <div className="workspace-frame">
      <WorkspaceNav displayName={displayName(user)} />
      <div className="workspace-layout">
        <WorkspaceSidebar />
        <main className="workspace-main">{children}</main>
      </div>
    </div>
  );
}
