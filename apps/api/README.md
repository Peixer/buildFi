# BuildFi API

Rust backend API for the BuildFi MVP: REST endpoints for projects and milestones, with an in-memory store (indexer-ready for future Solana integration).

## Run

From the repo root:

```bash
cargo run -p buildfi-api
```

Or from this directory:

```bash
cargo run
```

The server listens on `http://0.0.0.0:8080` by default. Set `PORT` in the environment or in a `.env` file to change it.

## Endpoints

- **GET /health** — Liveness/readiness
- **GET /projects** — List all projects
- **GET /projects/:id** — Get project by ID
- **POST /projects** — Create project (JSON body)
- **PATCH /projects/:id** — Update project (JSON body)

## Examples

Health check:

```bash
curl http://localhost:8080/health
```

List projects:

```bash
curl http://localhost:8080/projects
```

Create a project:

```bash
curl -X POST http://localhost:8080/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Riverfront Tower",
    "description": "Mixed-use development",
    "funding_target": 5000000000000,
    "escrow_treasury_address": "So11111111111111111111111111111111111111112",
    "milestones": [
      { "name": "Foundation", "percentage": 30 },
      { "name": "Structure", "percentage": 40 },
      { "name": "Finishing", "percentage": 30 }
    ]
  }'
```

## Database (PostgreSQL)

To persist data in PostgreSQL:

1. From the **repository root**, start Postgres: `docker compose up -d`
2. Copy `apps/api/.env.example` to `apps/api/.env` and set `DATABASE_URL=postgres://buildfi:buildfi@localhost:5432/buildfi` (or match the credentials in `docker-compose.yml`)
3. Run the API; migrations run automatically on startup when using the Postgres store.

Without `DATABASE_URL`, the API uses an in-memory store (no Docker required).

## Configuration

Copy `.env.example` to `.env` and adjust. Options:

- `PORT` — HTTP port (default: 8080)
- `DATABASE_URL` — Optional; when set, use PostgreSQL store; when unset, in-memory store is used
- `RUST_LOG` — Log level (e.g. `info`, `debug`)
