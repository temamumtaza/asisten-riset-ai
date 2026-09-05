"use client";

import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeedbackComposer({
  projectId,
  checkpointId
}: {
  projectId: string;
  checkpointId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [decision, setDecision] = useState<"comment" | "changes_requested" | "approved">("comment");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        "/api/v1/projects/" + projectId + "/checkpoints/" + checkpointId + "/feedback",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body, decision })
        }
      );
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setMessage(result.error?.message ?? "Masukan belum dapat disimpan.");
        return;
      }
      setBody("");
      setMessage("Masukan tercatat.");
      router.refresh();
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="artifact-form" onSubmit={submit}>
      <div className="item-topline">
        <h3>Catat masukan bimbingan</h3>
        <MessageSquarePlus size={18} aria-hidden="true" />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor={"feedback-" + checkpointId}>Isi masukan</label>
        <textarea
          className="form-control"
          id={"feedback-" + checkpointId}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Tuliskan masukan dosen dan bagian yang perlu kamu tindak lanjuti."
          required
        />
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor={"feedback-decision-" + checkpointId}>Arah masukan</label>
          <select className="form-control" id={"feedback-decision-" + checkpointId} value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
            <option value="comment">Catatan</option>
            <option value="changes_requested">Perlu revisi</option>
            <option value="approved">Disetujui dosen</option>
          </select>
        </div>
        <div className="paper-actions" style={{ alignItems: "end" }}>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan masukan"}
          </button>
        </div>
      </div>
      {message ? <p className="status-message" data-tone={message.includes("terputus") || message.includes("belum") ? "error" : "success"} role="status">{message}</p> : null}
    </form>
  );
}

