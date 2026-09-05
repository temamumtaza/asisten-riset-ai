import { createApiResponse, parseJsonBody } from "@/lib/api";
import { authenticatedContext, ownedProject } from "@/lib/server-auth";
import { feedbackUpdateSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ projectId: string; checkpointId: string; feedbackId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { projectId, checkpointId, feedbackId } = await context.params;
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);

    const { project, error: projectError } = await ownedProject(supabase, user.id, projectId);
    if (projectError) throw projectError;
    if (!project) return createApiResponse(null, { code: "NOT_FOUND", message: "Ruang riset tidak ditemukan." }, 404);

    const body = feedbackUpdateSchema.safeParse(await parseJsonBody(request));
    if (!body.success) return createApiResponse(null, { code: "INVALID_INPUT", message: "Status masukan tidak valid." }, 422);

    const { data, error } = await supabase
      .from("supervisor_feedback")
      .update({ is_addressed: body.data.isAddressed })
      .eq("id", feedbackId)
      .eq("checkpoint_id", checkpointId)
      .eq("project_id", projectId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return createApiResponse(null, { code: "NOT_FOUND", message: "Masukan tidak ditemukan." }, 404);

    return createApiResponse(data, null);
  } catch {
    return createApiResponse(null, { code: "FEEDBACK_UPDATE_FAILED", message: "Status masukan belum dapat diperbarui." }, 500);
  }
}
