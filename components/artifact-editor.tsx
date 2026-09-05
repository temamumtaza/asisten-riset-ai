"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import type { ResearchArtifact } from "@/lib/types";

const kindLabels: Record<ResearchArtifact["kind"], string> = {
  problem: "Masalah",
  question: "Pertanyaan",
  title: "Judul",
  framework: "Kerangka",
  method: "Metode",
  note: "Catatan"
};

export function ArtifactEditor({
  projectId,
  artifact
}: {
  projectId: string;
  artifact: ResearchArtifact;
}) {
  const [title, setTitle] = useState(artifact.title);
  const [content, setContent] = useState(artifact.content);
  const [status, setStatus] = useState(artifact.status);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        "/api/v1/projects/" + projectId + "/artifacts/" + artifact.id,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: artifact.kind,
            title,
            content,
            status,
            cycleId: artifact.cycle_id
          })
        }
      );
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setMessage(result.error?.message ?? "Catatan belum dapat disimpan.");
        return;
      }
      setMessage("Tersimpan");
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="artifact-form" onSubmit={save}>
      <div className="item-topline">
        <span className="item-kind">{kindLabels[artifact.kind]}</span>
        <label className="sr-only" htmlFor={"artifact-status-" + artifact.id}>Status catatan</label>
        <select
          className="form-control"
          id={"artifact-status-" + artifact.id}
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          style={{ width: "auto", minHeight: "36px", padding: "5px 8px", fontSize: "12px" }}
        >
          <option value="draft">Draf</option>
          <option value="review">Perlu ditinjau</option>
          <option value="approved">Disepakati</option>
        </select>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor={"artifact-title-" + artifact.id}>Judul catatan</label>
        <input
          className="form-control"
          id={"artifact-title-" + artifact.id}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor={"artifact-content-" + artifact.id}>Isi</label>
        <textarea
          className="form-control"
          id={"artifact-content-" + artifact.id}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Tulis apa yang sudah kamu pahami atau masih perlu dibuktikan."
        />
      </div>
      <div className="paper-actions">
        <button className="button button-quiet" type="submit" disabled={saving}>
          <Save size={15} aria-hidden="true" />
          {saving ? "Menyimpan..." : "Simpan catatan"}
        </button>
        <p className="status-message" data-tone={message === "Tersimpan" ? "success" : message ? "error" : undefined} role={message ? "status" : undefined}>
          {message}
        </p>
      </div>
    </form>
  );
}

