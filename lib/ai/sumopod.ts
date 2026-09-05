import { z } from "zod";
import { getSumopodConfig } from "@/lib/env";
import type { AiReview, ResearchArtifact, SavedPaper } from "@/lib/types";

export const aiReviewSchema = z.object({
  summary: z.string().min(1).max(3000),
  observations: z.array(z.object({
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(1200),
    relatedArtifact: z.string().max(160).nullable()
  })).max(6),
  nextAction: z.string().min(1).max(500),
  questions: z.array(z.string().min(1).max(300)).max(5)
});

export class AiProviderError extends Error {
  constructor(
    public readonly code: "AI_NOT_CONFIGURED" | "AI_UPSTREAM_ERROR" | "AI_INVALID_OUTPUT",
    message: string
  ) {
    super(message);
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getTextContent(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .map((part) => record(part).text)
    .filter((part): part is string => typeof part === "string")
    .join("");
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function buildPrompt(
  question: string,
  artifacts: ResearchArtifact[],
  papers: SavedPaper[]
) {
  const artifactContext = artifacts.length
    ? artifacts
        .map((artifact) => {
          return [
            "ARTIFACT_ID: " + artifact.id,
            "KIND: " + artifact.kind,
            "TITLE: " + artifact.title,
            "STATUS: " + artifact.status,
            "CONTENT: " + artifact.content.slice(0, 5000)
          ].join("\n");
        })
        .join("\n\n")
    : "Belum ada artefak riset.";
  const paperContext = papers.length
    ? papers
        .map((paper) => {
          return [
            "PAPER_ID: " + paper.id,
            "TITLE: " + paper.title,
            "YEAR: " + (paper.publicationYear ?? "tidak tercatat"),
            "SOURCE: " + paper.source,
            "ABSTRACT: " + (paper.abstract?.slice(0, 4000) ?? "abstrak tidak tersedia")
          ].join("\n");
        })
        .join("\n\n")
    : "Belum ada paper yang disimpan.";

  return [
    "Pertanyaan riset utama:",
    question,
    "",
    "Artefak yang ditulis mahasiswa:",
    artifactContext,
    "",
    "Paper yang disimpan mahasiswa:",
    paperContext,
    "",
    "Tugas:",
    "Bantu mahasiswa menilai kejelasan arah riset berdasarkan konteks di atas.",
    "Jangan membuat fakta, paper, penulis, angka, atau sitasi baru.",
    "Jika bukti belum cukup, katakan secara langsung.",
    "Kembalikan JSON valid saja dengan bentuk:",
    '{"summary":"...","observations":[{"title":"...","body":"...","relatedArtifact":"ARTIFACT_ID atau null"}],"nextAction":"...","questions":["..."]}',
    "Jangan menyatakan bahwa keputusan sudah disetujui. AI hanya memberi bahan diskusi."
  ].join("\n");
}

export async function runWorkspaceReview(input: {
  question: string;
  artifacts: ResearchArtifact[];
  papers: SavedPaper[];
}): Promise<{ review: AiReview; model: string }> {
  const config = getSumopodConfig();
  if (!config) {
    throw new AiProviderError(
      "AI_NOT_CONFIGURED",
      "Bantuan AI belum aktif. Tambahkan SUMOPOD_API_KEY di lingkungan server."
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(config.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + config.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content: "Kamu adalah pendamping riset yang teliti. Gunakan hanya konteks yang diberikan."
          },
          { role: "user", content: buildPrompt(input.question, input.artifacts, input.papers) }
        ],
        stream: false
      }),
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new AiProviderError(
        "AI_UPSTREAM_ERROR",
        "Layanan AI belum dapat menjawab. Coba lagi setelah memeriksa konfigurasi provider."
      );
    }

    const payload = record(await response.json());
    const choices = Array.isArray(payload.choices) ? payload.choices : [];
    const firstChoice = record(choices[0]);
    const message = record(firstChoice.message);
    const content = getTextContent(message.content);
    if (!content) {
      throw new AiProviderError("AI_INVALID_OUTPUT", "Layanan AI mengembalikan jawaban kosong.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(content));
    } catch {
      throw new AiProviderError("AI_INVALID_OUTPUT", "Jawaban AI tidak mengikuti format yang aman.");
    }

    const result = aiReviewSchema.safeParse(parsed);
    if (!result.success) {
      throw new AiProviderError("AI_INVALID_OUTPUT", "Jawaban AI tidak lolos pemeriksaan isi.");
    }

    return { review: result.data, model: config.model };
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new AiProviderError(
      "AI_UPSTREAM_ERROR",
      isTimeout
        ? "Layanan AI melewati batas waktu. Coba lagi."
        : "Layanan AI sedang tidak tersedia. Coba lagi."
    );
  } finally {
    clearTimeout(timeout);
  }
}

