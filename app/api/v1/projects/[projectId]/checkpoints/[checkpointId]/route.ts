import { createApiResponse, parseJsonBody } from "@/lib/api";
import { authenticatedContext, ownedProject } from "@/lib/server-auth";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["pending", "in_review", "changes_requested", "approved"])
});

type RouteContext = { params: Promise<{ projectId: string; checkpointId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { projectId, checkpointId } = await context.params;
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);
    const { project, error: projectError } = await ownedProject(supabase, user.id, projectId);
    if (projectError) throw projectError;
    if (!project) return createApiResponse(null, { code: "NOT_FOUND", message: "Ruang riset tidak ditemukan." }, 404);
    const body = statusSchema.safeParse(await parseJsonBody(request));
    if (!body.success) return createApiResponse(null, { code: "INVALID_INPUT", message: "Status checkpoint tidak valid." }, 422);

    const { data, error } = await supabase
      .from("supervisor_checkpoints")
      .update({ status: body.data.status })
      .eq("id", checkpointId)
      .eq("project_id", projectId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return createApiResponse(null, { code: "NOT_FOUND", message: "Checkpoint tidak ditemukan." }, 404);
    return createApiResponse(data, null);
  } catch {
    return createApiResponse(null, { code: "CHECKPOINT_UPDATE_FAILED", message: "Status checkpoint belum dapat diperbarui." }, 500);
  }
}

