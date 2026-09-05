export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export const CYCLE_STAGES = [
  { key: "direction", label: "Arah riset", description: "Masalah dan pertanyaan" },
  { key: "title", label: "Judul", description: "Fokus dan tujuan" },
  { key: "evidence", label: "Bukti", description: "Paper dan catatan" },
  { key: "framework", label: "Kerangka", description: "Hubungan gagasan" },
  { key: "method", label: "Metode", description: "Cara menjawab" },
  { key: "instrument", label: "Instrumen", description: "Alat pengumpulan" },
  { key: "analysis", label: "Analisis", description: "Membaca temuan" }
] as const;

export type ArtifactKind =
  | "problem"
  | "question"
  | "title"
  | "framework"
  | "method"
  | "note";

export type ArtifactStatus = "draft" | "review" | "approved";
export type CycleStatus = "planned" | "active" | "review" | "complete";
export type CheckpointStatus =
  | "pending"
  | "in_review"
  | "changes_requested"
  | "approved";

export interface ResearchProject {
  id: string;
  owner_id: string;
  title: string;
  research_field: string;
  research_question: string;
  status: "active" | "paused" | "complete";
  created_at: string;
  updated_at: string;
}

export interface ResearchCycle {
  id: string;
  project_id: string;
  sequence_number: number;
  title: string;
  objective: string;
  status: CycleStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchArtifact {
  id: string;
  project_id: string;
  cycle_id: string | null;
  kind: ArtifactKind;
  title: string;
  content: string;
  status: ArtifactStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaperAuthor {
  name: string;
  orcid?: string | null;
}

export type PaperSource = "openalex" | "semantic_scholar" | "crossref";

export interface NormalizedPaper {
  canonicalId: string;
  source: PaperSource;
  sourceId: string;
  title: string;
  abstract: string | null;
  authors: PaperAuthor[];
  publicationYear: number | null;
  venue: string | null;
  publisher: string | null;
  doi: string | null;
  landingUrl: string;
  pdfUrl: string | null;
  provenance: Record<string, string>;
}

export interface SavedPaper extends NormalizedPaper {
  id: string;
  projectId: string;
  createdAt: string;
}

export interface SupervisorFeedback {
  id: string;
  checkpoint_id: string;
  project_id: string;
  author_id: string;
  body: string;
  decision: "comment" | "changes_requested" | "approved";
  is_addressed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupervisorCheckpoint {
  id: string;
  project_id: string;
  cycle_id: string | null;
  title: string;
  summary: string;
  snapshot: {
    question: string;
    artifacts: Array<Pick<ResearchArtifact, "id" | "kind" | "title" | "content" | "status">>;
    savedPaperCount: number;
  };
  status: CheckpointStatus;
  created_at: string;
  updated_at: string;
  feedback?: SupervisorFeedback[];
}

export interface AiReview {
  summary: string;
  observations: Array<{
    title: string;
    body: string;
    relatedArtifact: string | null;
  }>;
  nextAction: string;
  questions: string[];
}
