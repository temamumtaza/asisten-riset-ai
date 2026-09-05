import { ConfigurationState } from "@/components/configuration-state";
import { WorkspaceHome } from "@/components/workspace-home";
import { getCurrentUser } from "@/lib/auth";
import type { ResearchProject } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadWorkspace() {
  try {
    const { user, supabase } = await getCurrentUser();
    if (!user) return { configurationError: false, user: null, projects: [] as ResearchProject[] };

    const { data, error } = await supabase
      .from("research_projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return { configurationError: false, user, projects: (data ?? []) as ResearchProject[] };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("MISSING_ENV_")) {
      return { configurationError: true, user: null, projects: [] as ResearchProject[] };
    }
    throw error;
  }
}

export default async function WorkspacePage() {
  const result = await loadWorkspace();
  if (result.configurationError) return <ConfigurationState />;
  if (!result.user) return null;
  const metadata = result.user.user_metadata as Record<string, unknown> | undefined;
  const rawName = metadata?.full_name ?? metadata?.name;
  const displayName = typeof rawName === "string" && rawName.trim() ? rawName.trim() : "Peneliti";
  return <WorkspaceHome displayName={displayName} projects={result.projects} />;
}
