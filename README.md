# SQLSandbox

A full‑stack SQL sandbox that lets you create isolated workspaces, define schemas and seed data, execute SQL safely against per‑workspace PostgreSQL schemas, and persist workspace state in MongoDB. It also provides optional AI helpers (via Google Generative AI) to fix, explain, and complete SQL.

## Tech Stack
- Frontend: React (Vite), Axios, Monaco Editor, Tailwind CSS
- Backend: Node.js, Express js
- Databases: PostgreSQL (query execution), MongoDB (workspace metadata persistence)
- AI: Google Generative AI (Gemini / Gemma models)

## High‑Level Architecture
- Client (SPA): The React app renders the SQL editor, schema builder, result viewer, and workspace manager. It calls REST endpoints on the backend.
- API (Express): Exposes REST endpoints under `/api` for workspace lifecycle, SQL execution, and AI utilities.
- PostgreSQL: Each workspace is mapped to a dedicated schema named `workspace_<workspaceId>`. All SQL is executed with the session `search_path` set to that schema.
- MongoDB: Stores workspace metadata (name and serialized tables). On mutating SQL, the backend re‑dumps the schema from PostgreSQL and updates the MongoDB document to keep both in sync.

Request flow:
1. Frontend requests workspace creation → Backend creates a Postgres schema, installs tables/rows, and persists the workspace in MongoDB.
2. Frontend executes SQL → Backend validates, sets `search_path` to the workspace schema, runs the query, and returns rows/fields/duration. On DDL/DML, it re‑serializes schema to MongoDB.
3. Optional AI actions → Backend calls Google Generative AI to fix/explain/complete SQL and returns results to the client.

## Getting Started
### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- MongoDB 6+
- (Optional) Google Generative AI API key for AI endpoints

### Environment Variables
Backend (`backend/.env`):
- `PORT=4000` (optional)
- `POSTGRES_URL=postgres://user:pass@host:5432/dbname`
- `PG_STATEMENT_TIMEOUT_MS=5000` (optional)
- `MONGO_URI=mongodb://localhost:27017`
- `GEMINI_API_KEY=...` (required only for AI endpoints)

Frontend (`frontend/.env`):
- `VITE_API_BASE=http://localhost:4000` (base URL for backend)

### Install & Run
In two terminals:

Backend
```
cd backend
npm install
npm run dev
```

Frontend
```
cd frontend
npm install
npm run dev
```

Then open the frontend URL printed by Vite (usually `http://localhost:5173`).

## API Overview
- `POST /api/workspaces` → Create workspace; body: `{ workspaceId, name?, tables? }`
- `GET /api/workspaces/:workspaceId` → Get workspace metadata
- `POST /api/workspaces/:workspaceId/load` → Recreate workspace schema/tables in Postgres from MongoDB
- `POST /api/workspaces/:workspaceId/save` → Upsert workspace metadata and sync DDL/DML into Postgres
- `POST /api/execute` → Execute SQL in the workspace schema; body: `{ workspaceId, sql }`
- `POST /api/ai/fix` → Return fixed SQL
- `POST /api/ai/explain` → Explain a query
- `POST /api/ai/complete` → Complete SQL from a prefix

## Development Notes
- SQL validation: requests are pre‑validated; queries are first executed inside a BEGIN/ROLLBACK to detect syntax errors before the actual run.
- Workspace isolation: `search_path` is set to `workspace_<workspaceId>` per request, so different workspaces do not interfere.
- Schema sync: On mutating queries (DDL/DML), the backend re‑serializes the current schema and persists to MongoDB to keep UI and state consistent.