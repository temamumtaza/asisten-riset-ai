"use client";

import { ClipboardCheck, Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackComposer } from "@/components/feedback-composer";
import type { SupervisorCheckpoint, SupervisorFeedback } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const statusLabels: Record<SupervisorCheckpoint["status"], string> = {
  pending: "Menunggu masukan",
  in_review: "Sedang dibahas",
  changes_requested: "Perlu revisi",
  approved: "Disetujui"
};

export function SupervisorPanel({
  projectId,
  cycleId,
  checkpoints,
  artifactCount,
  savedPaperCount
}: {
  projectId: string;
  cycleId: string | null;
  checkpoints: SupervisorCheckpoint[];
  artifactCount: number;
  savedPaperCount: number;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function createCheckpoint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/projects/" + projectId + "/checkpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, cycleId })
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setMessage(result.error?.message ?? "Checkpoint belum dapat dibuat.");
        return;
      }
      setTitle("");
      setSummary("");
      setMessage("Checkpoint tersimpan.");
      router.refresh();
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="desk-column" aria-labelledby="supervisor-title">
      <div className="section-heading">
        <h2 id="supervisor-title">Checkpoint bimbingan</h2>
        <small>{checkpoints.length} checkpoint</small>
      </div>
      <div className="supervisor-callout">
        <h2>Sudah ada bahan yang layak dibahas?</h2>
        <p>
          Buat ringkasan dari keadaan ruang riset saat ini. Setelah bimbingan, catat masukan dosen
          di bawah checkpoint yang sama agar revisinya tetap punya konteks.
        </p>
        <span className="status-label">{artifactCount} catatan · {savedPaperCount} paper</span>
      </div>
      <form className="checkpoint-form" onSubmit={createCheckpoint}>
        <div className="item-topline">
          <h3>Buat checkpoint baru</h3>
          <ClipboardCheck size={18} aria-hidden="true" />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="checkpoint-title">Judul checkpoint</label>
          <input className="form-control" id="checkpoint-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Arah masalah dan pertanyaan awal" required />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="checkpoint-summary">Ringkasan untuk dibahas</label>
          <textarea className="form-control" id="checkpoint-summary" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Bagian mana yang ingin kamu minta tanggapan dosen?" required />
        </div>
        <button className="button button-primary" type="submit" disabled={saving}>
          <Send size={15} aria-hidden="true" />
          {saving ? "Menyimpan..." : "Simpan checkpoint"}
        </button>
        {message ? <p className="status-message" data-tone={message.includes("terputus") || message.includes("belum") ? "error" : "success"} role="status">{message}</p> : null}
      </form>
      {checkpoints.length === 0 ? (
        <div className="empty-panel">
          <h2>Belum ada checkpoint untuk dibaca dosen.</h2>
          <p>Checkpoint menyimpan snapshot, jadi perubahan setelahnya tidak menghapus bahan bimbingan sebelumnya.</p>
        </div>
      ) : (
        <div className="checkpoint-list">
          {checkpoints.map((checkpoint) => (
            <CheckpointItem key={checkpoint.id} checkpoint={checkpoint} projectId={projectId} />
          ))}
        </div>
      )}
    </section>
  );
}

function CheckpointItem({
  checkpoint,
  projectId
}: {
  checkpoint: SupervisorCheckpoint;
  projectId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(checkpoint.status);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: SupervisorCheckpoint["status"]) {
    setStatus(nextStatus);
    setMessage("");
    const response = await fetch("/api/v1/projects/" + projectId + "/checkpoints/" + checkpoint.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!response.ok) {
      setStatus(checkpoint.status);
      setMessage("Status belum dapat diperbarui.");
      return;
    }
    setMessage("Status diperbarui.");
    router.refresh();
  }

  return (
    <article className="checkpoint-item" data-status={status}>
      <div className="item-topline">
        <span className="item-kind">{formatDate(checkpoint.created_at)}</span>
        <label className="sr-only" htmlFor={"checkpoint-status-" + checkpoint.id}>Status checkpoint</label>
        <select className="form-control" id={"checkpoint-status-" + checkpoint.id} value={status} onChange={(event) => updateStatus(event.target.value as SupervisorCheckpoint["status"])} style={{ width: "auto", minHeight: "36px", padding: "5px 8px", fontSize: "12px" }}>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <h3>{checkpoint.title}</h3>
      <p>{checkpoint.summary}</p>
      <p className="field-help">
        Snapshot ini berisi {checkpoint.snapshot.artifacts.length} catatan dan {checkpoint.snapshot.savedPaperCount} paper saat dibuat.
      </p>
      {checkpoint.feedback?.length ? (
        <div className="feedback-list">
          {checkpoint.feedback.map((feedback) => <FeedbackItem key={feedback.id} feedback={feedback} projectId={projectId} checkpointId={checkpoint.id} />)}
        </div>
      ) : null}
      {message ? <p className="status-message" data-tone="success" role="status">{message}</p> : null}
      <FeedbackComposer checkpointId={checkpoint.id} projectId={projectId} />
    </article>
  );
}

function FeedbackItem({
  feedback,
  projectId,
  checkpointId
}: {
  feedback: SupervisorFeedback;
  projectId: string;
  checkpointId: string;
}) {
  const router = useRouter();
  const [isAddressed, setIsAddressed] = useState(feedback.is_addressed);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function toggleAddressed() {
    const nextValue = !isAddressed;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        "/api/v1/projects/" + projectId + "/checkpoints/" + checkpointId + "/feedback/" + feedback.id,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAddressed: nextValue })
        }
      );
      if (!response.ok) {
        setMessage("Status belum dapat diperbarui.");
        return;
      }
      setIsAddressed(nextValue);
      setMessage(nextValue ? "Ditandai sudah ditindaklanjuti." : "Dikembalikan ke daftar tindak lanjut.");
      router.refresh();
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="feedback-note" data-addressed={isAddressed}>
      <p className="item-kind">{feedback.decision === "approved" ? "Disetujui" : feedback.decision === "changes_requested" ? "Perlu revisi" : "Catatan"}</p>
      <p>{feedback.body}</p>
      <div className="paper-actions">
        <button className="button button-quiet" type="button" onClick={toggleAddressed} disabled={saving} aria-pressed={isAddressed}>
          {saving ? "Menyimpan..." : isAddressed ? "Tandai belum selesai" : "Tandai sudah ditindaklanjuti"}
        </button>
        {message ? <span className="status-message" role="status">{message}</span> : null}
      </div>
    </div>
  );
}
