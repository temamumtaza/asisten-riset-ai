"use client";

import { ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { PaperResultCard } from "@/components/paper-result";
import type { NormalizedPaper, PaperSource } from "@/lib/types";

type SearchResult = {
  papers: NormalizedPaper[];
  statuses: Record<PaperSource, { state: "ok" | "failed"; count: number; message?: string }>;
  scholarUrl: string;
  partial: boolean;
};

const sourceLabels: Record<PaperSource, string> = {
  openalex: "OpenAlex",
  semantic_scholar: "Semantic Scholar",
  crossref: "Crossref"
};

export function PaperSearch({
  projectId,
  initialQuery,
  savedCount
}: {
  projectId: string;
  initialQuery: string;
  savedCount: number;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [sources, setSources] = useState<PaperSource[]>([
    "openalex",
    "semantic_scholar",
    "crossref"
  ]);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSource(source: PaperSource) {
    setSources((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source]
    );
  }

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setMessage("Tulis minimal dua karakter untuk mencari.");
      return;
    }
    if (sources.length === 0) {
      setMessage("Pilih setidaknya satu sumber.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/projects/" + projectId + "/papers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          sources,
          limit: 10,
          yearFrom: yearFrom ? Number(yearFrom) : null,
          yearTo: yearTo ? Number(yearTo) : null
        })
      });
      const payload = (await response.json()) as {
        data: SearchResult | null;
        error: { message?: string } | null;
      };
      if (!payload.data) {
        setMessage(payload.error?.message ?? "Pencarian belum dapat dijalankan.");
        setResult(null);
        return;
      }
      setResult(payload.data);
      if (payload.error) setMessage(payload.error.message ?? "Sebagian sumber belum tersedia.");
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="desk-column" aria-labelledby="paper-search-title">
      <div className="section-heading">
        <h2 id="paper-search-title">Cari bukti</h2>
        <small>{savedCount} paper tersimpan</small>
      </div>
      <form className="paper-search" onSubmit={search}>
        <div className="form-field">
          <label className="form-label" htmlFor="paper-query">Kata kunci paper</label>
          <div className="search-line">
            <input
              className="form-control"
              id="paper-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Contoh: digital reading habits higher education"
              required
            />
            <button className="button button-primary" type="submit" disabled={loading}>
              <Search size={16} aria-hidden="true" />
              {loading ? "Mencari..." : "Cari"}
            </button>
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="paper-year-from">Tahun dari</label>
            <input className="form-control" id="paper-year-from" inputMode="numeric" type="number" min="1800" max="3000" value={yearFrom} onChange={(event) => setYearFrom(event.target.value)} placeholder="Opsional" />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="paper-year-to">Tahun sampai</label>
            <input className="form-control" id="paper-year-to" inputMode="numeric" type="number" min="1800" max="3000" value={yearTo} onChange={(event) => setYearTo(event.target.value)} placeholder="Opsional" />
          </div>
        </div>
        <div className="form-field">
          <span className="form-label">Sumber metadata</span>
          <div className="source-pills" role="group" aria-label="Pilih sumber metadata">
            {(Object.keys(sourceLabels) as PaperSource[]).map((source) => (
              <button
                className="source-toggle"
                type="button"
                key={source}
                aria-pressed={sources.includes(source)}
                onClick={() => toggleSource(source)}
              >
                {sourceLabels[source]}
              </button>
            ))}
          </div>
        </div>
        {message ? <p className="status-message" data-tone="error" role="alert">{message}</p> : null}
      </form>

      {loading ? (
        <div className="empty-panel" aria-busy="true">
          <p className="eyebrow">Sedang mencari</p>
          <h2>Membaca metadata dari sumber yang dipilih.</h2>
          <p>Hasil akan muncul ketika provider selesai menjawab.</p>
        </div>
      ) : result ? (
        <>
          <div className="provider-status" aria-live="polite">
            {(Object.entries(result.statuses) as Array<[PaperSource, SearchResult["statuses"][PaperSource]]>).map(([source, status]) => (
              <span key={source} data-state={status.state}>
                {sourceLabels[source]}: {status.state === "ok" ? status.count + " hasil" : status.message}
              </span>
            ))}
          </div>
          <div className="paper-list" aria-live="polite">
            {result.papers.length ? result.papers.map((paper) => <PaperResultCard key={paper.canonicalId} projectId={projectId} paper={paper} />) : (
              <div className="empty-panel">
                <h2>Belum ada paper yang cocok.</h2>
                <p>Coba kata kunci yang lebih spesifik atau perluas rentang tahun.</p>
              </div>
            )}
          </div>
          <div className="supervisor-callout">
            <h2>Bandingkan juga di Google Scholar.</h2>
            <p>Google Scholar dibuka sebagai pencarian langsung. Aplikasi ini tidak mengambil hasilnya secara otomatis.</p>
            <a className="button button-secondary" href={result.scholarUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden="true" />
              Buka Google Scholar
            </a>
          </div>
        </>
      ) : (
        <div className="empty-panel">
          <p className="eyebrow">Pencarian pertama</p>
          <h2>Belum ada bukti untuk pertanyaan ini.</h2>
          <p>Cari paper pertama, baca sumbernya, lalu simpan yang ingin kamu bawa ke diskusi.</p>
        </div>
      )}
    </section>
  );
}

