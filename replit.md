# Home Stock Tracker

A shared household pantry tracker. Know what's in stock, what's running low, and what needs restocking — from any device.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, path `/api`)
- `pnpm --filter @workspace/pantry run dev` — run the frontend (path `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Required env

- `DATABASE_URL` — Postgres connection string
- `SESSION_SECRET` — secret for session signing
- See `.env.example` for all variables

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React 19, Vite 7, Tailwind CSS 4, React Query
- Build: esbuild (API CJS bundle), Vite (frontend)

## Where things live

```
artifacts/
  api-server/src/
    routes/      ← HTTP handlers only (thin, delegate to services)
    services/    ← business logic + DB queries
    utils/       ← response helpers (notFound, badRequest, etc.)
    middlewares/ ← Express middleware
    lib/         ← logger singleton
  pantry/src/
    pages/       ← route-level page components
    components/  ← reusable UI components
    utils/       ← status helpers (status.ts), formatters (format.ts)
    hooks/       ← custom React hooks
    lib/         ← client-side singletons
lib/
  db/            ← Drizzle schema + client (@workspace/db)
  api-spec/      ← OpenAPI spec (source of truth)
  api-client-react/ ← generated React Query hooks
  api-zod/       ← generated Zod schemas
```

## Architecture decisions

- Contract-first API: OpenAPI spec in `lib/api-spec/openapi.yaml` drives all codegen. Never manually write client hooks or Zod schemas.
- Services layer in the API server: route handlers are thin HTTP adapters; all DB logic lives in `src/services/`.
- Path aliases: `@/` works in the frontend (Vite resolves it); use relative imports in the API server (esbuild doesn't resolve `@/` by default).
- Shared status constants: frontend status labels, colors, and cycle logic live in `src/utils/status.ts` — don't repeat them in components.

## Product

- **Dashboard** — summary counts, needs-restock shortlist, category overview
- **Pantry list** — browse all items, filter by category/status, tap to cycle status inline
- **Add item** — name, category, status, quantity, unit, notes, who's adding
- **Item detail** — edit all fields, quick status toggle, delete

## User preferences

_Populate as you build._

## Gotchas

- After adding a new DB schema table, run `pnpm run typecheck:libs` before checking leaf artifacts — stale lib declarations cause false TS errors.
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`.
- The API server path aliases use relative imports (`../services/foo`), not `@/` aliases.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
