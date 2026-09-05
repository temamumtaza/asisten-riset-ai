"use client";

import { ExternalLink, BookmarkPlus, Check } from "lucide-react";
import { useState } from "react";
import type { NormalizedPaper } from "@/lib/types";
import { formatAuthors } from "@/lib/utils";

export function PaperResultCard({
  projectId,
  paper
}: {
  projectId: string;
  paper: NormalizedPaper;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function savePaper() {
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/v1/projects/" + projectId + "/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: paper.source,
          sourceId: paper.sourceId,
          canonicalId: paper.canonicalId,
          title: paper.title,
          abstract: paper.abstract,
          authors: paper.authors,
          publicationYear: paper.publicationYear,
          venue: paper.venue,
          publisher: paper.publisher,
          doi: paper.doi,
          landingUrl: paper.landingUrl,
          pdfUrl: paper.pdfUrl,
          provenance: paper.provenance
        })
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setState("error");
        setMessage(result.error?.message ?? "Paper belum dapat disimpan.");
        return;
      }
      setState("saved");
      setMessage("Tersimpan di ruang riset.");
    } catch {
      setState("error");
      setMessage("Koneksi terputus. Coba lagi.");
    }
  }

  return (
    <article className="paper-item">
      <div className="item-topline">
        <span className="item-kind">{paper.source.replace("_", " ")}</span>
        {paper.publicationYear ? <span className="item-kind">{paper.publicationYear}</span> : null}
      </div>
      <h3>{paper.title}</h3>
      <div className="paper-meta">
        <span>{formatAuthors(paper.authors)}</span>
        {paper.venue ? <span>{paper.venue}</span> : null}
        {paper.doi ? <span>DOI {paper.doi}</span> : null}
      </div>
      {paper.abstract ? <p className="paper-abstract">{paper.abstract}</p> : <p className="paper-abstract">Abstrak belum tersedia dari sumber ini.</p>}
      <div className="paper-actions">
        <button className="button button-quiet" type="button" onClick={savePaper} disabled={state === "saving" || state === "saved"}>
          {state === "saved" ? <Check size={15} aria-hidden="true" /> : <BookmarkPlus size={15} aria-hidden="true" />}
          {state === "saving" ? "Menyimpan..." : state === "saved" ? "Sudah disimpan" : "Simpan paper"}
        </button>
        <a className="button button-quiet" href={paper.landingUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={15} aria-hidden="true" />
          Buka sumber
        </a>
      </div>
      {message ? <p className="status-message" data-tone={state === "error" ? "error" : "success"} role="status">{message}</p> : null}
    </article>
  );
}

