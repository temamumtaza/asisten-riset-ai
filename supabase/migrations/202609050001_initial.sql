create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.research_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  research_field text not null check (char_length(trim(research_field)) between 2 and 120),
  research_question text not null check (char_length(trim(research_question)) between 10 and 1000),
  status text not null default 'active' check (status in ('active', 'paused', 'complete')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.research_cycles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  title text not null check (char_length(trim(title)) between 2 and 160),
  objective text not null check (char_length(trim(objective)) between 10 and 1000),
  status text not null default 'active' check (status in ('planned', 'active', 'review', 'complete')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, sequence_number)
);

create unique index if not exists one_active_cycle_per_project
  on public.research_cycles(project_id)
  where status = 'active';

create table if not exists public.research_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  cycle_id uuid references public.research_cycles(id) on delete set null,
  kind text not null check (kind in ('problem', 'question', 'title', 'framework', 'method', 'note')),
  title text not null check (char_length(trim(title)) between 2 and 160),
  content text not null default '' check (char_length(content) <= 20000),
  status text not null default 'draft' check (status in ('draft', 'review', 'approved')),
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.saved_papers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  source text not null check (source in ('openalex', 'semantic_scholar', 'crossref')),
  source_id text not null check (char_length(trim(source_id)) between 1 and 300),
  canonical_id text not null check (char_length(trim(canonical_id)) between 1 and 400),
  title text not null check (char_length(trim(title)) between 1 and 1000),
  abstract text,
  authors jsonb not null default '[]'::jsonb,
  publication_year integer check (publication_year between 0 and 3000),
  venue text,
  publisher text,
  doi text,
  landing_url text not null check (landing_url ~ '^https://'),
  pdf_url text check (pdf_url is null or pdf_url ~ '^https://'),
  provenance jsonb not null default '{}'::jsonb,
  saved_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, source, source_id)
);

create index if not exists saved_papers_project_created_idx
  on public.saved_papers(project_id, created_at desc);


create table if not exists public.supervisor_checkpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  cycle_id uuid references public.research_cycles(id) on delete set null,
  title text not null check (char_length(trim(title)) between 3 and 160),
  summary text not null check (char_length(trim(summary)) between 10 and 5000),
  snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'in_review', 'changes_requested', 'approved')),
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists supervisor_checkpoints_project_idx
  on public.supervisor_checkpoints(project_id, created_at desc);

create table if not exists public.supervisor_feedback (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id uuid not null references public.supervisor_checkpoints(id) on delete cascade,
  project_id uuid not null references public.research_projects(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  body text not null check (char_length(trim(body)) between 3 and 5000),
  decision text not null default 'comment' check (decision in ('comment', 'changes_requested', 'approved')),
  is_addressed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists supervisor_feedback_checkpoint_idx
  on public.supervisor_feedback(checkpoint_id, created_at asc);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  task text not null check (task in ('workspace_review', 'artifact_review')),
  input_summary jsonb not null default '{}'::jsonb,
  output jsonb,
  provider text not null default 'sumopod',
  model text not null,
  status text not null check (status in ('success', 'failed')),
  error_code text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_runs_project_created_idx
  on public.ai_runs(project_id, created_at desc);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  event_type text not null check (event_type in ('project_created', 'artifact_saved', 'paper_saved', 'checkpoint_created', 'feedback_added', 'ai_run')),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists projects_updated_at on public.research_projects;
create trigger projects_updated_at before update on public.research_projects
for each row execute function public.set_updated_at();

drop trigger if exists cycles_updated_at on public.research_cycles;
create trigger cycles_updated_at before update on public.research_cycles
for each row execute function public.set_updated_at();

drop trigger if exists artifacts_updated_at on public.research_artifacts;
create trigger artifacts_updated_at before update on public.research_artifacts
for each row execute function public.set_updated_at();

drop trigger if exists checkpoints_updated_at on public.supervisor_checkpoints;
create trigger checkpoints_updated_at before update on public.supervisor_checkpoints
for each row execute function public.set_updated_at();

drop trigger if exists feedback_updated_at on public.supervisor_feedback;
create trigger feedback_updated_at before update on public.supervisor_feedback
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.create_research_project(
  p_title text,
  p_research_field text,
  p_research_question text
)
returns public.research_projects
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_project public.research_projects;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.research_projects (owner_id, title, research_field, research_question)
  values (auth.uid(), trim(p_title), trim(p_research_field), trim(p_research_question))
  returning * into created_project;

  insert into public.research_cycles (
    project_id,
    sequence_number,
    title,
    objective,
    status,
    started_at
  )
  values (
    created_project.id,
    1,
    'Arah riset',
    'Perjelas masalah, pertanyaan, dan alasan mengapa topik ini perlu ditelusuri.',
    'active',
    timezone('utc', now())
  );

  insert into public.activity_events (project_id, event_type, entity_id)
  values (created_project.id, 'project_created', created_project.id);

  return created_project;
end;
$$;

grant execute on function public.create_research_project(text, text, text) to authenticated;
revoke execute on function public.create_research_project(text, text, text) from anon;

alter table public.profiles enable row level security;
alter table public.research_projects enable row level security;
alter table public.research_cycles enable row level security;
alter table public.research_artifacts enable row level security;
alter table public.saved_papers enable row level security;
alter table public.supervisor_checkpoints enable row level security;
alter table public.supervisor_feedback enable row level security;
alter table public.ai_runs enable row level security;
alter table public.activity_events enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists projects_owner_all on public.research_projects;
create policy projects_owner_all on public.research_projects
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists cycles_project_owner_all on public.research_cycles;
create policy cycles_project_owner_all on public.research_cycles
for all to authenticated
using (exists (
  select 1 from public.research_projects p
  where p.id = research_cycles.project_id and p.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.research_projects p
  where p.id = research_cycles.project_id and p.owner_id = auth.uid()
));

drop policy if exists artifacts_project_owner_all on public.research_artifacts;
create policy artifacts_project_owner_all on public.research_artifacts
for all to authenticated
using (exists (
  select 1 from public.research_projects p
  where p.id = research_artifacts.project_id and p.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.research_projects p
  where p.id = research_artifacts.project_id and p.owner_id = auth.uid()
));

drop policy if exists papers_project_owner_all on public.saved_papers;
create policy papers_project_owner_all on public.saved_papers
for all to authenticated
using (exists (
  select 1 from public.research_projects p
  where p.id = saved_papers.project_id and p.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.research_projects p
  where p.id = saved_papers.project_id and p.owner_id = auth.uid()
));

drop policy if exists checkpoints_project_owner_all on public.supervisor_checkpoints;
create policy checkpoints_project_owner_all on public.supervisor_checkpoints
for all to authenticated
using (exists (
  select 1 from public.research_projects p
  where p.id = supervisor_checkpoints.project_id and p.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.research_projects p
  where p.id = supervisor_checkpoints.project_id and p.owner_id = auth.uid()
));

drop policy if exists feedback_project_owner_all on public.supervisor_feedback;
create policy feedback_project_owner_all on public.supervisor_feedback
for all to authenticated
using (exists (
  select 1
  from public.research_projects p
  where p.id = supervisor_feedback.project_id and p.owner_id = auth.uid()
))
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.supervisor_checkpoints c
    join public.research_projects p on p.id = c.project_id
    where c.id = supervisor_feedback.checkpoint_id
      and p.id = supervisor_feedback.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists ai_runs_project_owner_all on public.ai_runs;
create policy ai_runs_project_owner_all on public.ai_runs
for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.research_projects p
    where p.id = ai_runs.project_id and p.owner_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.research_projects p
    where p.id = ai_runs.project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists activity_project_owner_select on public.activity_events;
create policy activity_project_owner_select on public.activity_events
for select to authenticated
using (exists (
  select 1 from public.research_projects p
  where p.id = activity_events.project_id and p.owner_id = auth.uid()
));

drop policy if exists activity_project_owner_insert on public.activity_events;
create policy activity_project_owner_insert on public.activity_events
for insert to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1 from public.research_projects p
    where p.id = activity_events.project_id and p.owner_id = auth.uid()
  )
);

revoke all on table public.profiles from anon;
revoke all on table public.research_projects from anon;
revoke all on table public.research_cycles from anon;
revoke all on table public.research_artifacts from anon;
revoke all on table public.saved_papers from anon;
revoke all on table public.supervisor_checkpoints from anon;
revoke all on table public.supervisor_feedback from anon;
revoke all on table public.ai_runs from anon;
revoke all on table public.activity_events from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.research_projects to authenticated;
grant select, insert, update, delete on table public.research_cycles to authenticated;
grant select, insert, update, delete on table public.research_artifacts to authenticated;
grant select, insert, update, delete on table public.saved_papers to authenticated;
grant select, insert, update, delete on table public.supervisor_checkpoints to authenticated;
grant select, insert, update, delete on table public.supervisor_feedback to authenticated;
grant select, insert, update, delete on table public.ai_runs to authenticated;
grant select, insert on table public.activity_events to authenticated;
