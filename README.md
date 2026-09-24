# Demo Authorization Visualizer

Runnable demo for visualizing JWT authentication, RBAC, site scope, business-unit data scope, MongoDB filtering, and Redis authorization decisions.

## Run with Docker Compose

```bash
docker compose up --build
```

Open:

- Web UI: http://localhost:3000
- API health: http://localhost:3001/health

The API seeds demo users, roles, sites, and transactions into MongoDB on startup. Redis stores authorization decisions using keys shaped like `authz:{userId}:{permission}:{siteId}:{businessUnit}`.

## Run locally

Copy `.env.example` to `.env` and start MongoDB and Redis, then run:

```bash
npm install
npm run dev
```

## Demo behavior

- `admin` has global access to dashboard, sales, and service status, but intentionally has no `finance.read` permission.
- `member-a` is restricted to `SITE-A` and `RETAIL`.
- `member-b` is restricted to `SITE-B` and `WHOLESALE`.
- The Request Simulator shows the API response, applied data filter, Redis HIT/MISS, and decision trace.
- Removing a role permission invalidates authorization cache entries so the next request performs a MongoDB check.

This project is intentionally a visual demo rather than a production policy engine.
