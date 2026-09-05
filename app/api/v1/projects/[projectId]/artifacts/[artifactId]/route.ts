import { createApiResponse, parseJsonBody } from "@/lib/api";
import { authenticatedContext, ownedProject } from "@/lib/server-auth";
import { artifactSchema } from "@/lib/validators";
import type { ResearchArtifact } from "@/lib/types";

type RouteContext = { params: Promise<{ projectId: string; artifactId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { projectId, artifactId } = await context.params;
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);
    const { project, error: projectError } = await ownedProject(supabase, user.id, projectId);
    if (projectError) throw projectError;
    if (!project) return createApiResponse(null, { code: "NOT_FOUND", message: "Ruang riset tidak ditemukan." }, 404);

    const body = artifactSchema.safeParse(await parseJsonBody(request));
    if (!body.success) {
      return createApiResponse(
        null,
        { code: "INVALID_INPUT", message: "Isi catatan belum lengkap.", details: body.error.issues.map((issue) => issue.message) },
        422
      );
    }
    const { data, error } = await supabase
      .from("research_artifacts")
      .update({
        cycle_id: body.data.cycleId ?? null,
        kind: body.data.kind,
        title: body.data.title,
        content: body.data.content,
        status: body.data.status
      })
      .eq("id", artifactId)
      .eq("project_id", projectId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return createApiResponse(null, { code: "NOT_FOUND", message: "Catatan tidak ditemukan." }, 404);

    await supabase.from("activity_events").insert({
      project_id: projectId,
      actor_id: user.id,
      event_type: "artifact_saved",
      entity_id: artifactId
    });
    return createApiResponse(data as ResearchArtifact, null);
  } catch {
    return createApiResponse(null, { code: "ARTIFACT_UPDATE_FAILED", message: "Catatan belum dapat diperbarui." }, 500);
  }
}

