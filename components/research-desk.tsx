"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AiReviewPanel } from "@/components/ai-review-panel";
import { ArtifactComposer } from "@/components/artifact-composer";
import { PaperSearch } from "@/components/paper-search";
import { SavedPaperShelf } from "@/components/saved-paper-shelf";
import { SupervisorPanel } from "@/components/supervisor-panel";
import { CYCLE_STAGES, type ResearchArtifact, type ResearchCycle, type ResearchProject, type SavedPaper, type SupervisorCheckpoint } from "@/lib/types";

export function ResearchDesk({
  project,
  cycle,
  artifacts,
  savedPapers,
  checkpoints
}: {
  project: ResearchProject;
  cycle: ResearchCycle | null;
  artifacts: ResearchArtifact[];
  savedPapers: SavedPaper[];
  checkpoints: SupervisorCheckpoint[];
}) {
  const completed = new Set<string>();
  if (artifacts.some((artifact) => artifact.kind === "problem" && artifact.status === "approved")) completed.add("direction");
  if (artifacts.some((artifact) => artifact.kind === "question" && artifact.status === "approved")) completed.add("direction");
  if (artifacts.some((artifact) => artifact.kind === "title" && artifact.status === "approved")) completed.add("title");
  if (savedPapers.length > 0) completed.add("evidence");
  if (artifacts.some((artifact) => artifact.kind === "framework" && artifact.status === "approved")) completed.add("framework");
  if (artifacts.some((artifact) => artifact.kind === "method" && artifact.status === "approved")) completed.add("method");

  const activeIndex = CYCLE_STAGES.findIndex((stage) => !completed.has(stage.key));
  const currentIndex = activeIndex === -1 ? CYCLE_STAGES.length - 1 : activeIndex;

  return (
    <div className="workspace-content">
      <div className="desk-topline">
        <Link className="back-link" href="/workspace">
          <ArrowLeft size={15} aria-hidden="true" />
          Semua ruang riset
        </Link>
        <span className="status-label">{cycle?.title ?? "Putaran riset aktif"}</span>
      </div>
      <header>
        <p className="eyebrow">Ruang riset</p>
        <h1 className="desk-title">{project.title}</h1>
        <div className="desk-question">
          <small>Pertanyaan yang sedang dibawa</small>
          <p>{project.research_question}</p>
        </div>
      </header>

      <section aria-labelledby="stage-title">
        <div className="sr-only" id="stage-title">Tahapan ruang riset</div>
        <div className="stage-rail">
          {CYCLE_STAGES.map((stage, index) => {
            const state = completed.has(stage.key)
              ? "complete"
              : index === currentIndex
                ? "active"
                : "future";
            return (
              <div className={"stage-item stage-item-" + state} key={stage.key}>
                <strong>{stage.label}</strong>
                <span>{stage.description}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="desk-grid">
        <div className="desk-column">
          <ArtifactComposer projectId={project.id} cycleId={cycle?.id ?? null} artifacts={artifacts} />
          <PaperSearch projectId={project.id} initialQuery={project.research_question} savedCount={savedPapers.length} />
          <SavedPaperShelf papers={savedPapers} />
        </div>
        <div className="desk-column">
          <AiReviewPanel projectId={project.id} />
          <SupervisorPanel
            projectId={project.id}
            cycleId={cycle?.id ?? null}
            checkpoints={checkpoints}
            artifactCount={artifacts.length}
            savedPaperCount={savedPapers.length}
          />
        </div>
      </div>
    </div>
  );
}

