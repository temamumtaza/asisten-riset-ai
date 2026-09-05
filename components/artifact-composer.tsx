"use client";

import { FilePlus2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArtifactEditor } from "@/components/artifact-editor";
import type { ResearchArtifact } from "@/lib/types";

const kindLabels: Record<ResearchArtifact["kind"], string> = {
  problem: "Masalah",
  question: "Pertanyaan",
  title: "Judul",
  framework: "Kerangka",
  method: "Metode",
  note: "Catatan"
};

export function ArtifactComposer({
  projectId,
  cycleId,
  artifacts
}: {
  projectId: string;
  cycleId: string | null;
  artifacts: ResearchArtifact[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<ResearchArtifact["kind"]>("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function createArtifact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/projects/" + projectId + "/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, content, status: "draft", cycleId })
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setMessage(result.error?.message ?? "Catatan belum dapat dibuat.");
        return;
      }
      setTitle("");
      setContent("");
      setMessage("Catatan baru tersimpan.");
      router.refresh();
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="desk-column" aria-labelledby="artifact-title">
      <div className="section-heading">
        <h2 id="artifact-title">Catatan yang sedang dibangun</h2>
        <small>{artifacts.length} catatan</small>
      </div>
      <form className="artifact-form" onSubmit={createArtifact}>
        <div className="item-topline">
          <h3>Tambahkan bagian</h3>
          <FilePlus2 size={18} aria-hidden="true" />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="new-artifact-kind">Jenis</label>
            <select
              className="form-control"
              id="new-artifact-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as ResearchArtifact["kind"])}
            >
              {Object.entries(kindLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="new-artifact-title">Judul</label>
            <input
              className="form-control"
              id="new-artifact-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Apa yang sedang kamu susun?"
              required
            />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="new-artifact-content">Isi catatan</label>
          <textarea
            className="form-control"
            id="new-artifact-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Tulis draf, alasan, atau hal yang ingin kamu periksa bersama dosen."
          />
        </div>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan bagian"}
        </button>
        {message ? <p className="status-message" data-tone={message.includes("terputus") || message.includes("belum") ? "error" : "success"} role="status">{message}</p> : null}
      </form>
      {artifacts.length === 0 ? (
        <div className="empty-panel">
          <h2>Belum ada catatan yang bisa dibaca ulang.</h2>
          <p>Mulai dari masalah, pertanyaan, atau satu catatan kecil. Draf yang kosong tidak akan dianggap sebagai keputusan.</p>
        </div>
      ) : (
        <div className="artifact-list">
          {artifacts.map((artifact) => (
            <ArtifactEditor artifact={artifact} key={artifact.id} projectId={projectId} />
          ))}
        </div>
      )}
    </section>
  );
}

