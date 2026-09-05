import { ExternalLink } from "lucide-react";
import type { SavedPaper } from "@/lib/types";
import { formatAuthors, formatDate } from "@/lib/utils";

export function SavedPaperShelf({ papers }: { papers: SavedPaper[] }) {
  return (
    <section className="desk-column" aria-labelledby="saved-paper-title">
      <div className="section-heading">
        <h2 id="saved-paper-title">Paper yang kamu simpan</h2>
        <small>{papers.length} paper</small>
      </div>
      {papers.length === 0 ? (
        <div className="empty-panel">
          <h2>Rak bukti masih kosong.</h2>
          <p>Simpan paper dari hasil pencarian agar dapat dibaca lagi saat menyusun checkpoint.</p>
        </div>
      ) : (
        <div className="paper-list">
          {papers.map((paper) => (
            <article className="paper-item" key={paper.id}>
              <div className="item-topline">
                <span className="item-kind">{paper.source.replace("_", " ")}</span>
                <span className="item-kind">{formatDate(paper.createdAt)}</span>
              </div>
              <h3>{paper.title}</h3>
              <div className="paper-meta">
                <span>{formatAuthors(paper.authors)}</span>
                {paper.publicationYear ? <span>{paper.publicationYear}</span> : null}
                {paper.venue ? <span>{paper.venue}</span> : null}
              </div>
              <div className="paper-actions">
                <a className="button button-quiet" href={paper.landingUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} aria-hidden="true" />
                  Buka sumber
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

