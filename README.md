# Freelance Invoicing Platform

A full-stack MERN app for freelancers/small agencies to track billable time and turn it into
invoices. MongoDB, Express, React, Node — all TypeScript.

Personal project, not a real billing product, but the invoicing logic itself (time aggregation,
double-billing prevention, status workflow) is real and tested, not just a UI mockup.

## How it works

1. Register/log in.
2. Add clients, and per client one or more projects with an hourly rate.
3. Log time entries against a project.
4. Generate an invoice for a client over a date range — it pulls every unbilled, billable entry
   across that client's projects, groups it by project, computes the totals, and marks those
   entries as invoiced so they can't get billed twice.
5. Move the invoice DRAFT → SENT → PAID. A SENT invoice past its due date just shows as OVERDUE.
6. Dashboard shows outstanding/paid totals, hours this month, revenue by month.

## Features

- JWT auth, everything scoped per user
- Full CRUD for clients/projects/time entries, invoice generation + status transitions
- The actual business logic: weighted time aggregation into invoice lines, atomic double-billing
  prevention, the DRAFT/SENT/PAID/OVERDUE rules
- Search, filters, pagination on every list
- Zod validation with proper field-level error messages
- Centralized error handling
- React + Tailwind UI, nothing fancy but responsive
- Unit tests + integration tests (Supertest, in-memory MongoDB)
- Docker Compose for the whole stack, GitLab CI

## Architecture

```
React (Vite, TanStack Query)  →  Express API  →  Mongoose  →  MongoDB
```

Same layering on the backend as I use in my Java project — controller → service → model, services
are the only thing that touch Mongoose directly. On the frontend, `api/` wraps the Axios calls per
resource, `hooks/` wraps those in TanStack Query for caching, `pages/` is one component per
resource.

## Stack

React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form + Zod, Tailwind on the
frontend. Node/Express/TypeScript, Mongoose, JWT, bcrypt, Zod on the backend. MongoDB 7. Jest +
Supertest + mongodb-memory-server for tests. Docker/Compose, GitLab CI/CD.

## Running it

```bash
cd server && npm install
cd ../client && npm install

cp server/.env.example server/.env
cp client/.env.example client/.env
```

Start Mongo (easiest via Docker):

```bash
docker run -d -p 27018:27017 --name invoicing-mongo mongo:7
```

Then two terminals:

```bash
cd server && npm run dev     # http://localhost:4000
cd client && npm run dev     # http://localhost:5173
```

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Frontend on `8090`, API on `4000/api`, Mongo on `27018` — moved off the usual defaults since I had
other stuff running locally on 80/27017. Override via `.env` if you need to.

## Endpoints

Auth: `POST /api/auth/register`, `POST /api/auth/login`.

Everything else needs `Authorization: Bearer <token>`: `/api/clients`, `/api/projects`,
`/api/time-entries`, `/api/invoices` (POST generates one from unbilled time), `PATCH
/api/invoices/:id/status`, `GET /api/dashboard/summary`.

## Tests

```bash
cd server
npm test
npm run lint
npm run typecheck

cd ../client
npm run build   # also typechecks the whole app
npm run lint
```

## CI/CD

`.gitlab-ci.yml`: typecheck + build (server/client in parallel) → lint → tests with JUnit reports →
Docker builds. Pushing images to a registry is a manual step since I don't have registry creds
wired into GitLab's free runners.

## Things I'd still add

- PDF export for invoices
- Multi-currency clients
- Email when an invoice gets marked SENT
- Recurring/retainer projects that auto-generate a monthly invoice
