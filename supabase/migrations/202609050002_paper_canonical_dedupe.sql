create unique index if not exists saved_papers_project_canonical_idx
  on public.saved_papers(project_id, canonical_id);

