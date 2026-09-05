import { createApiResponse, parseJsonBody } from "@/lib/api";
import { searchPapers } from "@/lib/papers";
import { authenticatedContext, ownedProject } from "@/lib/server-auth";
import { paperSearchSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);
    const { project, error: projectError } = await ownedProject(supabase, user.id, projectId);
    if (projectError) throw projectError;
    if (!project) return createApiResponse(null, { code: "NOT_FOUND", message: "Ruang riset tidak ditemukan." }, 404);

    const body = paperSearchSchema.safeParse(await parseJsonBody(request));
    if (!body.success) {
      return createApiResponse(
        null,
        { code: "INVALID_INPUT", message: "Tulis kata kunci pencarian yang valid.", details: body.error.issues.map((issue) => issue.message) },
        422
      );
    }

    const result = await searchPapers({
      query: body.data.query,
      sources: body.data.sources,
      limit: body.data.limit,
      yearFrom: body.data.yearFrom,
      yearTo: body.data.yearTo
    });
    const allFailed = Object.values(result.statuses).every((item) => item.state === "failed");
    if (allFailed) {
      return createApiResponse(
        result,
        { code: "PAPER_SOURCES_UNAVAILABLE", message: "Semua sumber belum dapat dihubungi. Coba lagi." },
        502,
        { providers: result.statuses, partial: false }
      );
    }

    return createApiResponse(result, null, 200, {
      providers: result.statuses,
      partial: result.partial
    });
  } catch {
    return createApiResponse(null, { code: "PAPER_SEARCH_FAILED", message: "Pencarian belum dapat dijalankan." }, 502);
  }
}

