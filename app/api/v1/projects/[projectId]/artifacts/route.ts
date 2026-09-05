import { createApiResponse, parseJsonBody } from "@/lib/api";
import { authenticatedContext, ownedProject } from "@/lib/server-auth";
import { artifactSchema } from "@/lib/validators";
import type { ResearchArtifact } from "@/lib/types";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);
    const { project, error: projectError } = await ownedProject(supabase, user.id, projectId);
    if (projectError) throw projectError;
    if (!project) return createApiResponse(null, { code: "NOT_FOUND", message: "Ruang riset tidak ditemukan." }, 404);

    const { data, error } = await supabase
      .from("research_artifacts")
      .select("*")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return createApiResponse((data ?? []) as ResearchArtifact[], null);
  } catch {
    return createApiResponse(null, { code: "ARTIFACTS_UNAVAILABLE", message: "Catatan riset belum dapat dimuat." }, 503);
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
      .insert({
        project_id: projectId,
        cycle_id: body.data.cycleId ?? null,
        kind: body.data.kind,
        title: body.data.title,
        content: body.data.content,
        status: body.data.status,
        created_by: user.id
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("activity_events").insert({
      project_id: projectId,
      actor_id: user.id,
      event_type: "artifact_saved",
      entity_id: data.id
    });

    return createApiResponse(data as ResearchArtifact, null, 201);
  } catch {
    return createApiResponse(null, { code: "ARTIFACT_CREATE_FAILED", message: "Catatan belum dapat disimpan." }, 500);
  }
}

