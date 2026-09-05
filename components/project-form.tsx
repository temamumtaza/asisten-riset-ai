"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

type FieldErrors = Partial<Record<"title" | "researchField" | "researchQuestion", string>>;

export function ProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [researchField, setResearchField] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage("");

    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, researchField, researchQuestion })
      });
      const result = (await response.json()) as {
        data: { id: string } | null;
        error: { message: string; details?: string[] } | null;
      };
      if (!response.ok || !result.data) {
        setMessage(result.error?.message ?? "Ruang riset belum dapat dibuat.");
        return;
      }
      router.push(("/workspace/" + result.data.id) as Route);
      router.refresh();
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="project-form" onSubmit={submit} noValidate>
      <div className="form-field">
        <label className="form-label" htmlFor="project-title">Nama ruang riset</label>
        <input
          className="form-control"
          id="project-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Contoh: Dampak kebiasaan membaca digital"
          aria-describedby={errors.title ? "project-title-error" : undefined}
          required
        />
        {errors.title ? <p className="field-error" id="project-title-error">{errors.title}</p> : null}
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="project-field">Bidang atau topik</label>
        <input
          className="form-control"
          id="project-field"
          name="researchField"
          value={researchField}
          onChange={(event) => setResearchField(event.target.value)}
          placeholder="Contoh: Pendidikan tinggi"
          required
        />
        {errors.researchField ? <p className="field-error">{errors.researchField}</p> : null}
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="project-question">Pertanyaan utama</label>
        <textarea
          className="form-control"
          id="project-question"
          name="researchQuestion"
          value={researchQuestion}
          onChange={(event) => setResearchQuestion(event.target.value)}
          placeholder="Apa yang ingin kamu pastikan melalui riset ini?"
          required
        />
        <p className="field-help">Tulis minimal satu kalimat. Pertanyaan ini bisa kamu ubah nanti.</p>
      </div>
      {message ? <p className="status-message" data-tone="error" role="alert">{message}</p> : null}
      <button className="button button-primary" type="submit" disabled={loading}>
        {loading ? "Membuat ruang..." : "Buat ruang riset"}
      </button>
    </form>
  );
}
