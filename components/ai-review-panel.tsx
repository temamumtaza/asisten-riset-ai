"use client";

import { CheckCircle2, FileSearch } from "lucide-react";
import { useState } from "react";
import type { AiReview } from "@/lib/types";

export function AiReviewPanel({ projectId }: { projectId: string }) {
  const [review, setReview] = useState<AiReview | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReview() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/projects/" + projectId + "/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "workspace_review", artifactIds: [] })
      });
      const payload = (await response.json()) as {
        data: AiReview | null;
        error: { message?: string } | null;
      };
      if (!response.ok || !payload.data) {
        setMessage(payload.error?.message ?? "Tinjauan belum dapat dibuat.");
        setReview(null);
        return;
      }
      setReview(payload.data);
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
      setReview(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-panel" aria-labelledby="ai-review-title">
      <div className="item-topline">
        <div>
          <p className="eyebrow">Tinjauan asisten</p>
          <h2 id="ai-review-title">Periksa arah sebelum bimbingan.</h2>
        </div>
        <FileSearch size={22} aria-hidden="true" />
      </div>
      <p>
        Asisten membaca pertanyaan, catatan, dan paper yang kamu simpan. Ia memberi bahan telaah,
        bukan persetujuan penelitian.
      </p>
      <button className="button button-primary" type="button" onClick={requestReview} disabled={loading}>
        <FileSearch size={15} aria-hidden="true" />
        {loading ? "Menelaah ruang..." : "Minta tinjauan"}
      </button>
      {message ? <p className="status-message" data-tone="error" role="alert">{message}</p> : null}
      {review ? (
        <div className="ai-output" aria-live="polite">
          <div>
            <h3>Ringkasan</h3>
            <p>{review.summary}</p>
          </div>
          <div>
            <h3>Hal yang perlu diperiksa</h3>
            <div className="desk-column">
              {review.observations.map((observation) => (
                <div className="ai-observation" key={observation.title}>
                  <strong>{observation.title}</strong>
                  <p>{observation.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>Langkah berikutnya</h3>
            <p><CheckCircle2 size={15} aria-hidden="true" /> {review.nextAction}</p>
          </div>
          {review.questions.length ? (
            <div>
              <h3>Pertanyaan untuk bimbingan</h3>
              <ul>
                {review.questions.map((question) => <li key={question}>{question}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

