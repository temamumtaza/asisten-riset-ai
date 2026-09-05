# Asisten Riset AI

Workspace riset untuk menyusun pertanyaan, membaca sumber, menyimpan bukti, dan meminta masukan dosen dalam putaran kerja yang bisa diulang.

## Local setup

1. Run npm install.
2. Copy .env.example to .env.local.
3. Fill the Supabase URL and publishable key.
4. Enable Google provider and the /auth/callback URL in Supabase Auth.
5. Set SUMOPOD_API_KEY for live AI assistance.
6. Run npm run dev.

## Checks

Run npm run typecheck, npm run lint, npm run test, npm run build, and npm run test:e2e.

## Production boundary

Paper metadata is fetched from OpenAlex, Semantic Scholar, and Crossref. Google Scholar is opened as external search because it does not provide a stable public API for automated retrieval. The application does not invent results when a provider or key is not available.

## Design

Read DESIGN.md before changing the interface. All major visual decisions need a short, inspectable reason.

