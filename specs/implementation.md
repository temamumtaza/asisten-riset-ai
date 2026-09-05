# Asisten Riset AI implementation brief

## Outcome

Help a student move from a research question to a decision that can be discussed with a supervisor. The source of truth is the student's workspace and its evidence trail. AI proposes language and questions, but it never approves a research decision.

## Architecture

- Next.js App Router with TypeScript and route handlers.
- Supabase Auth with Google only, Supabase Postgres, Storage-ready schema, and RLS.
- Provider adapters on the server for OpenAlex, Semantic Scholar, Crossref, and Google Scholar direct search.
- Sumopod adapter with server-only SUMOPOD_API_KEY, configurable base URL, and model.
- Browser UI calls same-origin route handlers. Server pages read Supabase using the authenticated session.
- One modular application first. No microservices until a measured bottleneck exists.

## First vertical slice

1. Google sign-in callback creates or refreshes the user profile.
2. Student creates a workspace with title, field, and research question.
3. Workspace seeds an active research cycle.
4. Student writes a problem, question, title, or method artifact.
5. Student searches live metadata from three provider APIs and opens Google Scholar directly.
6. Student saves one paper per provider identifier and sees its provenance.
7. Student asks the configured AI provider to review the workspace context.
8. Student creates a supervisor checkpoint with a real snapshot and feedback field.
9. Student can mark feedback as addressed and continue the cycle.

## Non-negotiable acceptance bars

- A missing provider secret produces a named configuration state, never fake content.
- A failing paper provider does not hide results from another provider.
- A saved paper is scoped to the authenticated project owner through RLS.
- Duplicate saves are idempotent.
- AI output is stored as an auditable run and is never silently treated as approved.
- Checkpoint and feedback status are persisted in Postgres.
- Every API route validates its request body and returns data, error, and meta.
- No user-facing page contains invented statistics, testimonials, avatars, or activity.
- Mobile 390 px has no horizontal overflow. All controls are keyboard reachable.

## External service boundaries

Google Scholar has no stable public API for this product. The app creates a real Scholar search URL and labels it as an external search. It does not scrape or pretend to have a combined Scholar result feed.

Sumopod request and response shape must be checked at runtime with the configured key. The adapter accepts an OpenAI-compatible chat completions response and returns a safe 503 configuration error or 502 upstream error when that contract cannot be verified.

## Security checkpoint

- Browser only receives the Supabase publishable key.
- Sumopod and optional provider keys stay in server route handlers.
- Auth is checked on every mutation and project is loaded through the authenticated Supabase client.
- RLS policies cover parent and child tables.
- Request sizes, query lengths, result limits, and URL protocols are constrained.
- Upstream errors are logged server-side without leaking payloads or credentials to clients.

