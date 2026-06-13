# Hirelytics

> Smart resume shortlisting system for modern HR teams — score, rank, and shortlist candidates based on skills, experience, and growth potential.

---

## Features

- **Skill Synergy Scoring** — matches candidate skill clusters against job requirements, not just keyword counts
- **Velocity Score** — rewards growth trajectory and learning potential over pedigree alone
- **Verified Proof of Work** — GitHub and portfolio links surface real work beyond the resume
- **Blind Hiring Mode** — strips name, photo, and personal identifiers from candidate views to reduce bias
- **Auto Rejection Feedback** — generates personalised feedback email drafts for rejected candidates
- **Batch Analysis** — score all pending candidates for a job in one click
- **Pipeline Dashboard** — live stats on applications, shortlists, rejections, and skill gaps

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Recharts |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL, Drizzle ORM |
| Validation | Zod v4, drizzle-zod |
| API Contract | OpenAPI 3.1, Orval codegen |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
hirelytics/
├── artifacts/
│   ├── resume-shortlister/     # React + Vite frontend
│   │   └── src/
│   │       ├── pages/          # Dashboard, Jobs, Candidates, Analyze
│   │       ├── components/     # Layout, UI primitives
│   │       └── lib/            # Utilities, API client hooks
│   └── api-server/             # Express 5 REST API
│       └── src/
│           ├── routes/         # Jobs, Candidates, Dashboard endpoints
│           ├── lib/            # Scoring engine (analyzer.ts)
│           └── db/             # Drizzle schema + seed
├── lib/
│   ├── api-spec/               # OpenAPI spec → codegen source of truth
│   └── api-client-react/       # Generated React Query hooks + Zod schemas
└── scripts/                    # Utility scripts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (or use the Replit built-in DB)

### Install

```bash
pnpm install
```

### Environment

Create a `.env` file at the root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hirelytics
SESSION_SECRET=your-secret-here
```

### Database setup

```bash
pnpm --filter @workspace/db run push    # Push schema
pnpm --filter @workspace/db run seed    # Seed sample data
```

### Run (development)

```bash
# API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Frontend (port 23023)
pnpm --filter @workspace/resume-shortlister run dev
```

Then open `http://localhost:23023`.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs` | List all jobs |
| POST | `/api/jobs` | Create a job |
| GET | `/api/candidates` | List candidates (filterable by job) |
| POST | `/api/candidates` | Add a candidate |
| POST | `/api/candidates/:id/analyze` | Score a candidate |
| GET | `/api/candidates/:id/feedback` | Get rejection feedback draft |
| GET | `/api/candidates/:id/blind` | Blind profile view |
| GET | `/api/dashboard/summary` | Headline stats |
| GET | `/api/dashboard/top-candidates` | Top scoring candidates |
| GET | `/api/dashboard/skill-gaps` | Skill gap analysis across jobs |

---

## Scoring System

Candidates are scored across three dimensions:

**Skill Synergy (0–100)**
Clusters related skills together (e.g. `React + TypeScript + Vite` = frontend cluster) and rewards depth within a cluster, not just breadth.

**Velocity Score (0–100)**
Measures growth rate relative to years of experience. A junior with a strong GitHub and side projects can outscore a senior with stale skills.

**Overall Score**
Weighted combination: `0.5 × SkillSynergy + 0.3 × Velocity + 0.2 × ProofOfWork`.

---

## Deployment

The app is structured for Replit deployment out of the box. For standalone deployments, each service (frontend + API) can be containerised independently.

---

## License

MIT
