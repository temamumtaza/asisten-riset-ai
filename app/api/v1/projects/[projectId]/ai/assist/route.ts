import { createApiResponse, parseJsonBody } from "@/lib/api";
import { AiProviderError, runWorkspaceReview } from "@/lib/ai/sumopod";
import { authenticatedContext, ownedProject } from "@/lib/server-auth";
import { aiAssistSchema } from "@/lib/validators";
import type { ResearchArtifact, SavedPaper } from "@/lib/types";

type RouteContext = { params: Promise<{ projectId: string }> };

function savedPaperFromRow(row: Record<string, unknown>): SavedPaper {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    source: row.source as SavedPaper["source"],
    sourceId: String(row.source_id),
    canonicalId: String(row.canonical_id),
    title: String(row.title),
    abstract: typeof row.abstract === "string" ? row.abstract : null,
    authors: Array.isArray(row.authors) ? row.authors as SavedPaper["authors"] : [],
    publicationYear: typeof row.publication_year === "number" ? row.publication_year : null,
    venue: typeof row.venue === "string" ? row.venue : null,
    publisher: typeof row.publisher === "string" ? row.publisher : null,
    doi: typeof row.doi === "string" ? row.doi : null,
    landingUrl: String(row.landing_url),
    pdfUrl: typeof row.pdf_url === "string" ? row.pdf_url : null,
    provenance: row.provenance && typeof row.provenance === "object"
      ? row.provenance as Record<string, string>
      : {},
    createdAt: String(row.created_at)
  };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);
    const { project, error: projectError } = await ownedProject(supabase, user.id, projectId);
    if (projectError) throw projectError;
    if (!project) return createApiResponse(null, { code: "NOT_FOUND", message: "Ruang riset tidak ditemukan." }, 404);

    const body = aiAssistSchema.safeParse(await parseJsonBody(request));
    if (!body.success) return createApiResponse(null, { code: "INVALID_INPUT", message: "Permintaan bantuan AI tidak valid." }, 422);

    const [{ data: artifactRows, error: artifactsError }, { data: paperRows, error: papersError }] =
      await Promise.all([
        supabase.from("research_artifacts").select("*").eq("project_id", projectId).order("updated_at", { ascending: false }).limit(12),
        supabase.from("saved_papers").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(12)
      ]);
    if (artifactsError) throw artifactsError;
    if (papersError) throw papersError;

    const artifacts = (artifactRows ?? []) as ResearchArtifact[];
    const selectedArtifacts = body.data.artifactIds.length
      ? artifacts.filter((artifact) => body.data.artifactIds.includes(artifact.id))
      : artifacts;
    const papers = (paperRows ?? []).map((row) => savedPaperFromRow(row as Record<string, unknown>));
    const inputSummary = {
      task: body.data.task,
      artifactIds: selectedArtifacts.map((artifact) => artifact.id),
      paperIds: papers.map((paper) => paper.id),
      artifactCount: selectedArtifacts.length,
      paperCount: papers.length
    };

    try {
      const result = await runWorkspaceReview({
        question: project.research_question,
        artifacts: selectedArtifacts,
        papers
      });
      await supabase.from("ai_runs").insert({
        project_id: projectId,
        user_id: user.id,
        task: body.data.task,
        input_summary: inputSummary,
        output: result.review,
        provider: "sumopod",
        model: result.model,
        status: "success"
      });
      await supabase.from("activity_events").insert({
        project_id: projectId,
        actor_id: user.id,
        event_type: "ai_run"
      });
      return createApiResponse(result.review, null, 200, { model: result.model });
    } catch (error) {
      const aiError = error instanceof AiProviderError
        ? error
        : new AiProviderError("AI_UPSTREAM_ERROR", "Layanan AI sedang tidak tersedia. Coba lagi.");
      await supabase.from("ai_runs").insert({
        project_id: projectId,
        user_id: user.id,
        task: body.data.task,
        input_summary: inputSummary,
        provider: "sumopod",
        model: process.env.SUMOPOD_MODEL ?? "gemini/gemini-3.1-flash-lite",
        status: "failed",
        error_code: aiError.code
      });
      const status = aiError.code === "AI_NOT_CONFIGURED" ? 503 : 502;
      return createApiResponse(null, { code: aiError.code, message: aiError.message }, status);
    }
  } catch {
    return createApiResponse(null, { code: "AI_REQUEST_FAILED", message: "Bantuan AI belum dapat dijalankan." }, 500);
  }
}

