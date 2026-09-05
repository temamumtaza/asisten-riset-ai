import { createApiResponse, parseJsonBody } from "@/lib/api";
import { authenticatedContext, ownedProject } from "@/lib/server-auth";
import { feedbackSchema } from "@/lib/validators";
import type { SupervisorFeedback } from "@/lib/types";

type RouteContext = { params: Promise<{ projectId: string; checkpointId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { projectId, checkpointId } = await context.params;
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);
    const { project, error: projectError } = await ownedProject(supabase, user.id, projectId);
    if (projectError) throw projectError;
    if (!project) return createApiResponse(null, { code: "NOT_FOUND", message: "Ruang riset tidak ditemukan." }, 404);

    const { data: checkpoint, error: checkpointError } = await supabase
      .from("supervisor_checkpoints")
      .select("id")
      .eq("id", checkpointId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (checkpointError) throw checkpointError;
    if (!checkpoint) return createApiResponse(null, { code: "NOT_FOUND", message: "Checkpoint tidak ditemukan." }, 404);

    const body = feedbackSchema.safeParse(await parseJsonBody(request));
    if (!body.success) {
      return createApiResponse(null, { code: "INVALID_INPUT", message: "Masukan belum cukup untuk disimpan." }, 422);
    }
    const { data, error } = await supabase
      .from("supervisor_feedback")
      .insert({
        checkpoint_id: checkpointId,
        project_id: projectId,
        author_id: user.id,
        body: body.data.body,
        decision: body.data.decision
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("activity_events").insert({
      project_id: projectId,
      actor_id: user.id,
      event_type: "feedback_added",
      entity_id: data.id
    });
    return createApiResponse(data as SupervisorFeedback, null, 201);
  } catch {
    return createApiResponse(null, { code: "FEEDBACK_CREATE_FAILED", message: "Masukan belum dapat disimpan." }, 500);
  }
}

