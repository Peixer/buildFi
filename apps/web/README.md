# BuildFi Web

Next.js frontend for the BuildFi MVP: landing page and explore (projects list), integrated with the Rust API in `apps/api`.

## Prerequisites

- Node.js 18+
- The BuildFi API must be running so the explore page can load projects. From the repo root: `cargo run -p buildfi-api` (default: http://localhost:8080).

## Setup

```bash
# From repo root (installs deps for all workspaces)
npm install

# Optional: copy env example and set API URL if different from default
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Run

From repo root:

```bash
npm run dev
# or from this directory:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The **Explore** page fetches projects from the API; ensure the API is running and `NEXT_PUBLIC_API_URL` points to it (default `http://localhost:8080`).

## Scripts

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run start` — Run production server
- `npm run lint` — Run ESLint

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the BuildFi API. Default: `http://localhost:8080`. |
