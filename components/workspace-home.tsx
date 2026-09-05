"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight, FolderPlus } from "lucide-react";
import { ProjectForm } from "@/components/project-form";
import type { ResearchProject } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function WorkspaceHome({
  displayName,
  projects
}: {
  displayName: string;
  projects: ResearchProject[];
}) {
  return (
    <div className="workspace-content">
      <header className="workspace-heading">
        <div className="eyebrow-stack">
          <p className="eyebrow">Ruang riset</p>
          <h1>Selamat datang, {displayName}.</h1>
          <p>Mulai dari satu pertanyaan yang ingin kamu bawa ke percakapan dengan dosen.</p>
        </div>
        {projects.length > 0 ? (
          <a className="button button-primary" href="#buat-ruang">
            <FolderPlus size={16} aria-hidden="true" />
            Buat ruang baru
          </a>
        ) : null}
      </header>

      {projects.length === 0 ? (
        <div className="project-grid">
          <section className="empty-panel" aria-labelledby="empty-project-title">
            <p className="eyebrow">Belum ada ruang</p>
            <h2 id="empty-project-title">Belum ada bukti untuk pertanyaanmu.</h2>
            <p>
              Buat ruang riset pertama. Setelah itu kamu dapat menulis arah, mencari paper nyata,
              menyimpan kutipan, dan menyiapkan checkpoint bimbingan.
            </p>
          </section>
          <section className="project-form-panel" id="buat-ruang" aria-labelledby="first-project-title">
            <h2 id="first-project-title">Mulai satu ruang</h2>
            <p>Isi yang kamu tahu sekarang. Tidak perlu menunggu semuanya sempurna.</p>
            <ProjectForm />
          </section>
        </div>
      ) : (
        <div className="project-grid">
          <section aria-labelledby="project-list-title">
            <div className="section-heading">
              <h2 id="project-list-title">Ruang yang kamu buat</h2>
              <small>{projects.length} ruang</small>
            </div>
            <div className="project-list">
              {projects.map((project) => (
                <Link className="project-row" href={("/workspace/" + project.id) as Route} key={project.id}>
                  <div>
                    <h2>{project.title}</h2>
                    <p>{project.research_field} · {project.research_question}</p>
                  </div>
                  <div className="project-meta">
                    <span>{formatDate(project.updated_at)}</span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="project-form-panel" id="buat-ruang" aria-labelledby="new-project-title">
            <h2 id="new-project-title">Ruang berikutnya</h2>
            <p>Setiap ruang punya pertanyaan dan putaran bimbingannya sendiri.</p>
            <ProjectForm />
          </section>
        </div>
      )}
    </div>
  );
}
