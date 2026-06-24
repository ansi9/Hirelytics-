# Hirelytics

AI-powered smart resume shortlisting system that scores candidates on skill synergy, velocity potential, and verified proof of work — helping HR teams hire faster and more fairly.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/resume-shortlister run dev` — run the frontend (port 23023)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/resume-shortlister/` — React + Vite frontend (preview at `/`)
- `artifacts/api-server/` — Express API server (serves at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-zod/` — Generated Zod schemas for server-side validation
- `lib/api-client-react/` — Generated React Query hooks for frontend
- `lib/db/src/schema/` — Drizzle ORM schema (`jobs.ts`, `candidates.ts`)

## Architecture decisions

- Contract-first: OpenAPI spec drives both server Zod schemas and frontend React Query hooks via Orval codegen
- Candidate scoring uses three axes: skill synergy (60% weight), velocity potential (40% weight), and verified proof of work (binary flag)
- Bias reduction: `/candidates/:id/blind` endpoint strips name, email, and university for blind review
- Rejection feedback: AI-generated personalized improvement emails per candidate
- No external AI APIs — scoring is deterministic heuristic logic in `artifacts/api-server/src/lib/analyzer.ts`

## Product

- **Dashboard** — overview of hiring pipeline stats, vacancy trends, top candidates
- **Job Postings** — create and manage open roles with required skill lists
- **Candidates** — upload resumes, view scores, update status (shortlisted/rejected/pending)
- **Analyze** — batch-analyze candidates against a job's required skills
- **Blind Review** — anonymized candidate view for bias-free evaluation
- **Feedback** — auto-generated rejection email per candidate with improvement areas

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching frontend code
- The frontend workspace package is `@workspace/resume-shortlister`, not `@workspace/api-server`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
