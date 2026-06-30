# Home Stock Tracker

A shared household pantry tracker for couples. Know at a glance what's in stock, what's running low, and what needs restocking — from any device.

## Stack

| Layer | Tech |
|---|---|
| Monorepo | pnpm workspaces |
| Language | TypeScript 5.9, Node.js 24 |
| Frontend | React 19, Vite 7, Tailwind CSS 4 |
| Backend | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4, drizzle-zod |
| API contract | OpenAPI 3.1 + Orval codegen |
| Build | esbuild (API), Vite (frontend) |

## Project Structure

```
/
├── artifacts/
│   ├── api-server/          # Express REST API (port 8080, path /api)
│   │   └── src/
│   │       ├── routes/      # HTTP handlers — thin, delegate to services
│   │       ├── services/    # Business logic and database access
│   │       ├── utils/       # Shared response helpers
│   │       ├── middlewares/ # Express middleware
│   │       └── lib/         # Logger and other singletons
│   └── pantry/              # React + Vite frontend (path /)
│       └── src/
│           ├── pages/       # Route-level page components
│           ├── components/  # Reusable UI components
│           ├── utils/       # Status helpers, formatters
│           ├── hooks/       # Custom React hooks
│           └── lib/         # Client-side singletons
├── lib/
│   ├── db/                  # Drizzle schema and client (@workspace/db)
│   ├── api-spec/            # OpenAPI spec source of truth
│   ├── api-client-react/    # Generated React Query hooks
│   └── api-zod/             # Generated Zod validation schemas
└── scripts/                 # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9+
- PostgreSQL database

### Setup

```bash
# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env

# Push database schema
pnpm --filter @workspace/db run push

# Start API server (dev)
pnpm --filter @workspace/api-server run dev

# Start frontend (dev)
pnpm --filter @workspace/pantry run dev
```

## Development Commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Build all packages
pnpm run build

# Regenerate API client + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only — use migrations in production)
pnpm --filter @workspace/db run push
```

## API Overview

All routes are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/items` | List items (filter by `category`, `status`) |
| POST | `/api/items` | Add a new item |
| GET | `/api/items/:id` | Get item by ID |
| PATCH | `/api/items/:id` | Update item fields |
| DELETE | `/api/items/:id` | Delete item |
| PATCH | `/api/items/:id/status` | Quick status update |
| GET | `/api/items/summary` | Count by status |
| GET | `/api/items/needs-restock` | Items that are low or out |
| GET | `/api/items/categories` | Category breakdown |

## Environment Variables

See `.env.example` for all required and optional variables.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | API server port (default: 8080) |
| `NODE_ENV` | No | `development` or `production` |
| `LOG_LEVEL` | No | Pino log level (default: `info`) |
| `SESSION_SECRET` | No | Secret for session signing |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Note: Product barcode data is retrieved from [Open Food Facts](https://world.openfoodfacts.org/) under the Open Database License (ODbL).*
