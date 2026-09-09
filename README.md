# Friendly Marks

Read, mark and store your PDFs in one place — a shelf of documents, real
highlighting/pen/sticky-note annotation on rendered PDF pages, and reading
progress synced across every device you open a document on.

## Stack

- **apps/web** — React 18 + TypeScript + Vite. Real PDF rendering via
  `pdfjs-dist` (canvas + selectable text layer), server state via
  `@tanstack/react-query`. Design system: `src/organic.css`.
- **apps/api** — FastAPI + SQLAlchemy + Alembic + PostgreSQL. Session-cookie
  auth (argon2 password hashing), S3-compatible object storage for PDF bytes
  (MinIO), PyMuPDF for background text extraction, Postgres full-text search
  (`tsvector`/GIN) over document text and annotations.
- **db** — PostgreSQL 16.
- **storage** — MinIO (S3-compatible), for uploaded PDF files.

See `docker-compose.yml` for the full service list; each service's inclusion
is deliberately minimal for this app's scale (no Redis, no separate search
engine, no message queue, no reverse proxy — see the project's design notes
for why).

## Running it

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:8000 (docs at `/docs`, health at `/health`)
- MinIO console: http://localhost:9001

The `api` service runs pending Alembic migrations on startup, and
`storage-init` creates the MinIO bucket on first boot — a fresh
`docker compose up --build` from a clean clone needs nothing installed
locally beyond Docker.

## Local development without Docker

Each app can also run directly on the host against a local PostgreSQL and an
S3-compatible endpoint:

```bash
# apps/api
cd apps/api
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
cp .env.example .env   # point DATABASE_URL/MINIO_* at your local services
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload

# apps/web
cd apps/web
npm install
cp .env.example .env
npm run dev
```

Backend tests (`cd apps/api && .venv/bin/pytest`) spin up their own
Postgres-backed test database and an in-process S3-compatible server
(`moto`), so they don't require Docker or a real MinIO/Postgres instance
beyond a local `psql`-reachable Postgres server.

## Repository layout

```
apps/
  web/    React + Vite frontend
  api/    FastAPI backend (models/schemas/routers/services, Alembic migrations)
docker-compose.yml
.env.example
```
