import type {
  ResearchArtifact,
  SavedPaper,
  SupervisorCheckpoint,
  SupervisorFeedback
} from "@/lib/types";

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function mapSavedPaper(row: Record<string, unknown>): SavedPaper {
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
    provenance: objectValue(row.provenance) as Record<string, string>,
    createdAt: String(row.created_at)
  };
}

export function mapCheckpoint(
  row: Record<string, unknown>,
  feedback: SupervisorFeedback[]
): SupervisorCheckpoint {
  const snapshot = objectValue(row.snapshot);
  const artifacts = Array.isArray(snapshot.artifacts)
    ? snapshot.artifacts as Array<Pick<ResearchArtifact, "id" | "kind" | "title" | "content" | "status">>
    : [];
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    cycle_id: typeof row.cycle_id === "string" ? row.cycle_id : null,
    title: String(row.title),
    summary: String(row.summary),
    snapshot: {
      question: typeof snapshot.question === "string" ? snapshot.question : "",
      artifacts,
      savedPaperCount: typeof snapshot.savedPaperCount === "number" ? snapshot.savedPaperCount : 0
    },
    status: row.status as SupervisorCheckpoint["status"],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    feedback
  };
}

