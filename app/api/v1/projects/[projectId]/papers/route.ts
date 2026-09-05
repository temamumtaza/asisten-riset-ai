import { createApiResponse, parseJsonBody } from "@/lib/api";
import { authenticatedContext, ownedProject } from "@/lib/server-auth";
import { paperSaveSchema } from "@/lib/validators";

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
      .from("saved_papers")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return createApiResponse(data ?? [], null);
  } catch {
    return createApiResponse(null, { code: "PAPERS_UNAVAILABLE", message: "Paper tersimpan belum dapat dimuat." }, 503);
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

    const body = paperSaveSchema.safeParse(await parseJsonBody(request));
    if (!body.success) {
      return createApiResponse(
        null,
        { code: "INVALID_INPUT", message: "Data paper belum lengkap.", details: body.error.issues.map((issue) => issue.message) },
        422
      );
    }

    const paper = body.data;
    const { data: existing, error: existingError } = await supabase
      .from("saved_papers")
      .select("*")
      .eq("project_id", projectId)
      .eq("canonical_id", paper.canonicalId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return createApiResponse(existing, null, 200, { duplicate: true });

    const { data: upserted, error: upsertError } = await supabase
      .from("saved_papers")
      .upsert({
        project_id: projectId,
        source: paper.source,
        source_id: paper.sourceId,
        canonical_id: paper.canonicalId,
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        publication_year: paper.publicationYear,
        venue: paper.venue,
        publisher: paper.publisher,
        doi: paper.doi,
        landing_url: paper.landingUrl,
        pdf_url: paper.pdfUrl,
        provenance: paper.provenance,
        saved_by: user.id
      }, { onConflict: "project_id,canonical_id", ignoreDuplicates: true })
      .select()
      .maybeSingle();
    if (upsertError) throw upsertError;

    const data = upserted;
    if (!data) {
      const { data: existingCanonical, error: canonicalError } = await supabase
        .from("saved_papers")
        .select("*")
        .eq("project_id", projectId)
        .eq("canonical_id", paper.canonicalId)
        .maybeSingle();
      if (canonicalError) throw canonicalError;
      if (!existingCanonical) throw new Error("PAPER_SAVE_NOT_RETURNED");
      return createApiResponse(existingCanonical, null, 200, { duplicate: true });
    }

    await supabase.from("activity_events").insert({
      project_id: projectId,
      actor_id: user.id,
      event_type: "paper_saved",
      entity_id: data.id
    });

    return createApiResponse(data, null, 201);
  } catch {
    return createApiResponse(null, { code: "PAPER_SAVE_FAILED", message: "Paper belum dapat disimpan." }, 500);
  }
}
