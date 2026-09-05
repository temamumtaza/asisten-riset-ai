# Asisten Riset AI

## Working rules

- Keep all user data paths authenticated and scoped through Supabase RLS.
- Never add sample rows, fake statistics, fictional people, or fake paper records.
- Keep external API keys server-only.
- Use DESIGN.md for UI direction. The UI uses plain Indonesian, no emoji, and no em dash in user-facing text.
- Use real loading, empty, and error states with a next action.
- Run npm run check before handing off code. Run browser QA for UI changes.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read antislop core and then the skill for the task:
- UI / visual: skills/antislop-ui/SKILL.md
- Copy and text: skills/antislop-copywriting/SKILL.md
- People: skills/antislop-human/SKILL.md
- Mobile / responsive: skills/antislop-layoutmobile/SKILL.md
- Code comments: skills/antislop-code/SKILL.md
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
