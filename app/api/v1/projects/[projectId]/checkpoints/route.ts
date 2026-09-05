import { createApiResponse, parseJsonBody } from "@/lib/api";
import { authenticatedContext, ownedProject } from "@/lib/server-auth";
import { checkpointSchema } from "@/lib/validators";
import type { ResearchArtifact, SupervisorCheckpoint, SupervisorFeedback } from "@/lib/types";

type RouteContext = { params: Promise<{ projectId: string }> };

async function checkpointSnapshot(
  supabase: Awaited<ReturnType<typeof authenticatedContext>>["supabase"],
  projectId: string,
  question: string
) {
  const [{ data: cycle }, { data: artifacts, error: artifactsError }, { count, error: papersError }] =
    await Promise.all([
      supabase.from("research_cycles").select("id").eq("project_id", projectId).eq("status", "active").maybeSingle(),
      supabase.from("research_artifacts").select("id,kind,title,content,status").eq("project_id", projectId).order("updated_at", { ascending: false }),
      supabase.from("saved_papers").select("id", { count: "exact", head: true }).eq("project_id", projectId)
    ]);
  if (artifactsError) throw artifactsError;
  if (papersError) throw papersError;
  return {
    cycleId: cycle?.id ?? null,
    snapshot: {
      question,
      artifacts: (artifacts ?? []) as Array<Pick<ResearchArtifact, "id" | "kind" | "title" | "content" | "status">>,
      savedPaperCount: count ?? 0
    }
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);
    const { project, error: projectError } = await ownedProject(supabase, user.id, projectId);
    if (projectError) throw projectError;
    if (!project) return createApiResponse(null, { code: "NOT_FOUND", message: "Ruang riset tidak ditemukan." }, 404);

    const { data: checkpoints, error } = await supabase
      .from("supervisor_checkpoints")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ids = (checkpoints ?? []).map((item) => item.id);
    const { data: feedback } = ids.length
      ? await supabase.from("supervisor_feedback").select("*").in("checkpoint_id", ids).order("created_at", { ascending: true })
      : { data: [] };
    const feedbackByCheckpoint = new Map<string, SupervisorFeedback[]>();
    for (const item of (feedback ?? []) as SupervisorFeedback[]) {
      feedbackByCheckpoint.set(item.checkpoint_id, [...(feedbackByCheckpoint.get(item.checkpoint_id) ?? []), item]);
    }

    const result = (checkpoints ?? []).map((checkpoint) => ({
      ...checkpoint,
      feedback: feedbackByCheckpoint.get(checkpoint.id) ?? []
    })) as SupervisorCheckpoint[];
    return createApiResponse(result, null);
  } catch {
    return createApiResponse(null, { code: "CHECKPOINTS_UNAVAILABLE", message: "Checkpoint belum dapat dimuat." }, 503);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);
    const { project, error: projectError } = await ownedProject(supabase, user.id, projectId);
    if (projectError) throw projectError;
    if (!project) return createApiResponse(null, { code: "NOT_FOUND", message: "Ruang riset tidak ditemukan." }, 404);

    const body = checkpointSchema.safeParse(await parseJsonBody(request));
    if (!body.success) {
      return createApiResponse(
        null,
        { code: "INVALID_INPUT", message: "Ringkasan checkpoint belum lengkap.", details: body.error.issues.map((issue) => issue.message) },
        422
      );
    }

    const { cycleId, snapshot } = await checkpointSnapshot(supabase, projectId, project.research_question);
    const { data, error } = await supabase
      .from("supervisor_checkpoints")
      .insert({
        project_id: projectId,
        cycle_id: body.data.cycleId ?? cycleId,
        title: body.data.title,
        summary: body.data.summary,
        snapshot,
        created_by: user.id
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("activity_events").insert({
      project_id: projectId,
      actor_id: user.id,
      event_type: "checkpoint_created",
      entity_id: data.id
    });
    return createApiResponse(data as SupervisorCheckpoint, null, 201);
  } catch {
    return createApiResponse(null, { code: "CHECKPOINT_CREATE_FAILED", message: "Checkpoint belum dapat dibuat." }, 500);
  }
}
