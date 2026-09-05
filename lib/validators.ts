import { z } from "zod";

const trimmedText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const projectCreateSchema = z.object({
  title: trimmedText(3, 160),
  researchField: trimmedText(2, 120),
  researchQuestion: trimmedText(10, 1000)
});

export const artifactSchema = z.object({
  kind: z.enum(["problem", "question", "title", "framework", "method", "note"]),
  title: trimmedText(2, 160),
  content: z.string().max(20_000),
  status: z.enum(["draft", "review", "approved"]).default("draft"),
  cycleId: z.string().uuid().nullable().optional()
});

export const paperSearchSchema = z.object({
  query: trimmedText(2, 300),
  sources: z
    .array(z.enum(["openalex", "semantic_scholar", "crossref"]))
    .min(1)
    .max(3)
    .default(["openalex", "semantic_scholar", "crossref"]),
  limit: z.number().int().min(1).max(20).default(10),
  yearFrom: z.number().int().min(1800).max(3000).nullable().optional(),
  yearTo: z.number().int().min(1800).max(3000).nullable().optional()
}).refine(
  (value) =>
    value.yearFrom === null ||
    value.yearFrom === undefined ||
    value.yearTo === null ||
    value.yearTo === undefined ||
    value.yearFrom <= value.yearTo,
  { message: "Rentang tahun tidak valid.", path: ["yearTo"] }
);

export const paperSaveSchema = z.object({
  source: z.enum(["openalex", "semantic_scholar", "crossref"]),
  sourceId: trimmedText(1, 300),
  canonicalId: trimmedText(1, 400),
  title: trimmedText(1, 1000),
  abstract: z.string().max(50_000).nullable(),
  authors: z.array(z.object({ name: trimmedText(1, 300), orcid: z.string().nullable().optional() })).max(100),
  publicationYear: z.number().int().min(0).max(3000).nullable(),
  venue: z.string().max(500).nullable(),
  publisher: z.string().max(500).nullable(),
  doi: z.string().max(500).nullable(),
  landingUrl: z.string().url().refine((value) => value.startsWith("https://"), "URL sumber harus HTTPS."),
  pdfUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), "URL PDF harus HTTPS.")
    .nullable(),
  provenance: z.record(z.string(), z.string()).default({})
});

export const checkpointSchema = z.object({
  cycleId: z.string().uuid().nullable().optional(),
  title: trimmedText(3, 160),
  summary: trimmedText(10, 5000)
});

export const feedbackSchema = z.object({
  body: trimmedText(3, 5000),
  decision: z.enum(["comment", "changes_requested", "approved"]).default("comment")
});

export const feedbackUpdateSchema = z.object({
  isAddressed: z.boolean()
});

export const aiAssistSchema = z.object({
  task: z.enum(["workspace_review", "artifact_review"]).default("workspace_review"),
  artifactIds: z.array(z.string().uuid()).max(12).default([])
});
