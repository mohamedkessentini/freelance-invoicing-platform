# Freelance Invoicing Platform

A full-stack MERN application for freelancers and small agencies to track billable time and
generate invoices from it. Built with MongoDB, Express, React, and Node.js, all in TypeScript.

This is a personal learning/portfolio project, not a production billing system, but the invoicing
logic (weighted time aggregation, double-billing prevention, status workflow) is real and tested.

## Overview

1. Register/log in as a freelancer.
2. Add **clients** and, per client, one or more **projects** with an hourly rate.
3. Log **time entries** against a project (billable or not).
4. Generate an **invoice** for a client over a date range — it pulls every unbilled, billable time
   entry across that client's projects, groups it by project, computes line-item amounts and a
   total, and marks those entries as invoiced so they can never be billed twice.
5. Move the invoice through DRAFT → SENT → PAID; a SENT invoice past its due date displays as
   OVERDUE automatically.
6. Check the dashboard for outstanding/paid totals, hours logged this month, and revenue by month.

## Features

- JWT authentication (register/login), all data scoped per user
- CRUD for clients, projects, time entries; invoice generation and status transitions
- Real business logic: weighted-average time aggregation into invoice line items, atomic
  double-billing prevention, DRAFT/SENT/PAID/OVERDUE status rules
- Search (clients), filtering (by client/project/status), and pagination on every list endpoint
- Zod request validation with consistent field-level error responses
- Centralized error handling (404/400/401/409/422)
- Responsive React UI (Tailwind CSS) with forms, tables, and a small revenue chart
- Unit tests (business logic, in-memory MongoDB) + integration tests (full HTTP flow, Supertest)
- Docker, Docker Compose (Mongo + API + nginx-served frontend), GitLab CI/CD

## Architecture

```
React (Vite, TanStack Query)  →  Express REST API  →  Mongoose  →  MongoDB
        ↑                              ↑
  React Hook Form + Zod        Controller → Service → Model
   (client-side validation)    (same layering as the Java project)
```

- **`server/src/models`** — Mongoose schemas (User, Client, Project, TimeEntry, Invoice).
- **`server/src/services`** — business logic and the only layer that touches models directly.
- **`server/src/controllers`** — thin HTTP adapters; parse request, call a service, send a response.
- **`server/src/middleware`** — JWT auth (`requireAuth`), Zod validation, centralized error handler.
- **`client/src/api`** — one module per resource wrapping Axios calls.
- **`client/src/hooks`** — TanStack Query hooks (`useClients`, `useInvoices`, ...) wrapping the API
  modules with caching/invalidation.
- **`client/src/pages`** — one page per resource, each owning its own list + create form.

## Tech Stack

| Layer      | Technology                                                         |
|------------|----------------------------------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS |
| Backend    | Node.js, Express, TypeScript, Mongoose, JWT, bcrypt, Zod            |
| Database   | MongoDB 7                                                            |
| Testing    | Jest, Supertest, mongodb-memory-server                              |
| Containers | Docker, Docker Compose                                               |
| CI/CD      | GitLab CI/CD                                                          |

## Project Structure

```
freelance-invoicing-platform/
├── server/
│   ├── src/
│   │   ├── config/        # env, MongoDB connection
│   │   ├── models/        # Mongoose schemas
│   │   ├── services/      # business logic
│   │   ├── controllers/   # HTTP handlers
│   │   ├── routes/        # Express routers
│   │   ├── middleware/    # auth, validation, error handling
│   │   ├── validators/    # Zod schemas
│   │   └── utils/         # ApiError, pagination, logger
│   ├── tests/
│   │   ├── unit/          # business logic tests (in-memory MongoDB)
│   │   └── integration/   # full HTTP flow tests (Supertest)
│   └── Dockerfile
├── client/
│   ├── src/
│   │   ├── api/           # Axios calls per resource
│   │   ├── hooks/         # TanStack Query hooks
│   │   ├── pages/         # one page per resource
│   │   ├── components/    # Layout, ProtectedRoute, StatusBadge, Pagination
│   │   ├── context/        # AuthContext (JWT storage)
│   │   └── types/         # shared TypeScript interfaces
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .gitlab-ci.yml
├── CV_DESCRIPTION.md
└── INTERVIEW_PREPARATION.md
```

## Prerequisites

- Node.js 20+
- Docker Desktop (for MongoDB locally, or the full stack via Compose)

## Installation

```bash
git clone <your-repo-url>
cd freelance-invoicing-platform
cd server && npm install
cd ../client && npm install
```

## Configuration

Each service has its own `.env.example` — copy to `.env` in both `server/` and `client/`:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Key variables (see each `.env.example` for the full list): `MONGO_URI`, `JWT_SECRET`,
`CORS_ORIGIN` (server), `VITE_API_URL` (client, baked into the build at build time).

## Running locally

Start MongoDB (Docker is simplest):

```bash
docker run -d -p 27018:27017 --name invoicing-mongo mongo:7
```

Then, in two terminals:

```bash
cd server && npm run dev     # http://localhost:4000
cd client && npm run dev     # http://localhost:5173
```

## Docker

Each service has its own Dockerfile (multi-stage: build, then a minimal runtime image — Node
Alpine for the API, nginx Alpine serving the static build for the client).

```bash
docker build -t invoicing-server ./server
docker build -t invoicing-client ./client
```

## Docker Compose

Runs MongoDB, the API, and the frontend (served by nginx) together:

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: `http://localhost:8090`
- API: `http://localhost:4000/api`
- MongoDB: `localhost:27018`

Ports default to 8090/4000/27018 (not 80/4000/27017) to avoid clashing with other local services;
override via `.env` (`CLIENT_PORT`, `API_PORT`, `MONGO_PORT`).

## API Documentation

No Swagger UI on this project (kept scope focused on the MERN stack itself) — key endpoints:

| Method | Path                                    | Description                              |
|--------|------------------------------------------|--------------------------------------------|
| POST   | `/api/auth/register`                     | Create an account, returns a JWT           |
| POST   | `/api/auth/login`                        | Log in, returns a JWT                      |
| GET/POST | `/api/clients`                         | List (search/paginate) / create clients    |
| GET/POST | `/api/projects`                        | List (filter by client) / create projects  |
| GET/POST | `/api/time-entries`                    | List (filter) / log time                   |
| DELETE | `/api/time-entries/:id`                  | Delete an entry (only if not yet invoiced) |
| GET/POST | `/api/invoices`                        | List (filter) / generate an invoice        |
| PATCH  | `/api/invoices/:id/status`                | Transition DRAFT→SENT or SENT→PAID         |
| GET    | `/api/dashboard/summary`                  | Outstanding/paid totals, hours, revenue    |

All routes except `/api/auth/*` require `Authorization: Bearer <token>`.

## Testing

```bash
cd server
npm test              # unit + integration (spins up an in-memory MongoDB automatically)
npm run lint
npm run typecheck

cd ../client
npm run build          # tsc -b && vite build - fails the build on type errors
```

## CI/CD

`.gitlab-ci.yml` runs, on every push: typecheck + build (server and client in parallel), lint,
unit+integration tests (with JUnit reports surfaced in the MR UI), then builds both Docker images.
Pushing the images to a registry is a manual gate (`docker-push`), since it needs registry
credentials as CI/CD variables that aren't available on GitLab.com's free shared runners by
default.

## Screenshots

Verified end-to-end through the real UI (not just curl): register → create client → create project
→ log time → generate invoice → mark as sent → mark as paid, both via `npm run dev` and via the
full `docker compose up` stack (nginx-served frontend talking to the containerized API).

## Future Improvements

- PDF export for invoices (currently viewable in-app only)
- Multi-currency portfolios per client with FX conversion
- Email delivery when an invoice is marked as SENT
- Recurring/retainer projects that auto-generate a monthly invoice
- Role-based access if a freelancer wants to invite a bookkeeper with read-only access

## What I Learned

- Structuring an Express + TypeScript API with the same controller/service/model layering used in
  the Java project, and why `verbatimModuleSyntax` (TypeScript) forces `import type` for type-only
  imports — it lets bundlers safely strip type imports without running a full type-checker first.
- Preventing double-billing with a single conditional `updateMany` (matching `invoiced: false`
  again at write time) instead of a naive find-then-update, which has a race window under
  concurrent requests.
- Using `mongodb-memory-server` for fast, hermetic service-level tests against a *real* MongoDB
  engine instead of mocking Mongoose queries — the Node equivalent of Testcontainers.
- Wiring React Hook Form + Zod with `z.coerce.number()` requires typing `useForm` with its
  `<TFieldValues, TContext, TTransformedValues>` triple-generic (input type pre-coercion vs. output
  type post-coercion) — otherwise the resolver and the form's field types disagree.
- Building a small MongoDB aggregation pipeline (`$group`, `$dateToString`) for the revenue-by-month
  dashboard instead of pulling every invoice into the app and summing in JavaScript.
