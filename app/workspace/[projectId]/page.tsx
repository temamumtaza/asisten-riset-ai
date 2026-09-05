import { notFound } from "next/navigation";
import { ConfigurationState } from "@/components/configuration-state";
import { ResearchDesk } from "@/components/research-desk";
import { getCurrentUser } from "@/lib/auth";
import { mapCheckpoint, mapSavedPaper } from "@/lib/db-mappers";
import type {
  ResearchArtifact,
  ResearchCycle,
  ResearchProject,
  SupervisorFeedback
} from "@/lib/types";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export const dynamic = "force-dynamic";

async function loadProject(projectId: string) {
  try {
    const { user, supabase } = await getCurrentUser();
    if (!user) return { configurationError: false, user: null, data: null };

    const { data: projectData, error: projectError } = await supabase
      .from("research_projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!projectData) return { configurationError: false, user, data: null };

    const [
      { data: cycleData, error: cycleError },
      { data: artifactData, error: artifactError },
      { data: paperData, error: paperError },
      { data: checkpointData, error: checkpointError }
    ] = await Promise.all([
      supabase.from("research_cycles").select("*").eq("project_id", projectId).eq("status", "active").maybeSingle(),
      supabase.from("research_artifacts").select("*").eq("project_id", projectId).order("updated_at", { ascending: false }),
      supabase.from("saved_papers").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("supervisor_checkpoints").select("*").eq("project_id", projectId).order("created_at", { ascending: false })
    ]);
    if (cycleError) throw cycleError;
    if (artifactError) throw artifactError;
    if (paperError) throw paperError;
    if (checkpointError) throw checkpointError;

    const checkpoints = (checkpointData ?? []) as Array<Record<string, unknown>>;
    const checkpointIds = checkpoints.map((checkpoint) => String(checkpoint.id));
    const { data: feedbackData, error: feedbackError } = checkpointIds.length
      ? await supabase.from("supervisor_feedback").select("*").in("checkpoint_id", checkpointIds).order("created_at", { ascending: true })
      : { data: [], error: null };
    if (feedbackError) throw feedbackError;

    const feedbackByCheckpoint = new Map<string, SupervisorFeedback[]>();
    for (const row of (feedbackData ?? []) as SupervisorFeedback[]) {
      feedbackByCheckpoint.set(row.checkpoint_id, [
        ...(feedbackByCheckpoint.get(row.checkpoint_id) ?? []),
        row
      ]);
    }

    return {
      configurationError: false,
      user,
      data: {
        project: projectData as ResearchProject,
        cycle: cycleData as ResearchCycle | null,
        artifacts: (artifactData ?? []) as ResearchArtifact[],
        savedPapers: (paperData ?? []).map((row) => mapSavedPaper(row as Record<string, unknown>)),
        checkpoints: checkpoints.map((row) =>
          mapCheckpoint(row, feedbackByCheckpoint.get(String(row.id)) ?? [])
        )
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("MISSING_ENV_")) {
      return { configurationError: true, user: null, data: null };
    }
    throw error;
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const result = await loadProject(projectId);
  if (result.configurationError) return <ConfigurationState />;
  if (!result.user) return null;
  if (!result.data) notFound();
  return <ResearchDesk {...result.data} />;
}
