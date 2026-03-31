# HTTP Caching Experiments — Design Spec

## Purpose

A learning project to understand HTTP caching patterns using two microservices, Varnish reverse proxies, and a React frontend. The goal is to see how TTL-based caching combined with ETag revalidation reduces latency and request volume when composing data from multiple services.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│              (TanStack Query, Debug Panel)                       │
│                     Port 3000                                    │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────┐
│  Varnish (Directory) │      │  Varnish (Individuals)  │
│     Port 8081        │      │     Port 8082            │
└──────────┬──────────┘      └──────────┬──────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────┐
│  Company Directory   │      │  Individuals Service    │
│  Service (Express)   │      │  (Express)              │
│  Port 4001           │      │  Port 4002              │
└─────────────────────┘      └─────────────────────────┘
```

- Frontend calls Varnish ports (8081/8082), never backend services directly.
- "No cache" mode: frontend switches to calling backend ports (4001/4002) via a UI toggle.
- Docker Compose runs all 5 containers.

## Data Model

### Company Directory Service (port 4001)

In-memory storage:

```js
teams: [
  { id: "team-1", name: "Engineering", memberIds: ["ind-1", "ind-2", "ind-3"] },
  { id: "team-2", name: "Design", memberIds: ["ind-2", "ind-4"] }
]
```

An individual can belong to multiple teams.

### Individuals Service (port 4002)

In-memory storage:

```js
individuals: [
  { id: "ind-1", firstName: "Alice", lastName: "Martin", avatarId: "avatar-1" },
  // ~8-10 individuals total
]
```

## API Endpoints

### Company Directory

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/teams` | List all teams (id + name only) |
| `GET` | `/teams/:id` | Single team with `memberIds` |
| `PUT` | `/teams/:id/members` | Update member list (add/remove individuals) |

### Individuals

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/individuals/:id` | Single individual's info |
| `PUT` | `/individuals/:id` | Update individual info (name, avatar) |

## Caching Strategy

Combined TTL + ETag approach on both services.

### Headers Set by Backend Services

On `GET` responses:

- `Cache-Control: max-age=60` (1 min TTL)
- `ETag` based on a hash of the resource data
- `X-Xkey: {resource-type}-{id}` surrogate key for targeted purging

On `PUT` responses:

- `X-Purge: {resource-type}-{id}` to signal Varnish to invalidate the affected cache entry

### Varnish VCL Behavior

**`vcl_recv` (on request):**
- `GET` requests: look up in cache
- `PUT`/`POST` requests: pass through to backend (never cached)

**`vcl_backend_response` (on backend response):**
- Read `X-Xkey` header, store as surrogate key on the cached object
- Read `X-Purge` header, if present: purge all objects matching that key, strip the header from client response
- Respect `Cache-Control` and `ETag` from backend

**`vcl_hit` (on expired TTL):**
- Conditional request to backend with `If-None-Match` (ETag)
- `304 Not Modified`: refresh TTL, serve from cache
- `200`: replace cached entry

**Response headers added by Varnish:**
- `X-Cache: HIT` or `X-Cache: MISS`
- `Age` (built-in — how old the cached response is)

## Frontend

### Tech Stack

- React with Vite
- TanStack Query for data fetching and client-side caching

### Composition Flow

1. `GET /teams` — get list of teams (id + name)
2. For each team, `GET /teams/:id` — get `memberIds`
3. For each unique individual ID across all teams, `GET /individuals/:id` — get info
4. Deduplicate: if an individual appears in multiple teams, fetch only once
5. Render teams with their fully resolved members

### TanStack Query Configuration

- Query key `["individual", id]` per individual
- Query key `["team", id]` per team
- `staleTime` set to 60s to match backend TTL

### Cache Toggle

A UI switch changes the base URL:
- **Cached mode**: Varnish ports (8081/8082)
- **No-cache mode**: Backend ports (4001/4002)
- Switching clears TanStack Query cache so all requests go fresh

### Immediate Consistency for the Editing User

Two approaches, both demonstrated:

**Approach 1 — Optimistic update (client-side):**
- After successful `PUT`, `onSuccess` updates TanStack's local cache via `queryClient.setQueryData`
- No refetch needed — UI updates instantly
- Other users still see stale data until TTL expires

**Approach 2 — Cache purge (server-side):**
- Backend's `PUT` response includes `X-Purge` — Varnish evicts the stale entry
- Frontend invalidates the TanStack query (`queryClient.invalidateQueries`) triggering a refetch
- Refetch hits Varnish (MISS) and gets fresh data from backend

### Debug Panel

Located at the bottom or side of the UI. Shows for each request:

- URL
- Response time (ms)
- `X-Cache` status (HIT/MISS)
- `Age` header value
- `ETag` value
- Total request count and cache hit ratio
- Cache hits highlighted in green, misses in red

## Docker Compose

```yaml
services:
  directory-service:      # Express, port 4001
  individuals-service:    # Express, port 4002
  varnish-directory:      # Varnish, port 8081 → directory-service:4001
  varnish-individuals:    # Varnish, port 8082 → individuals-service:4002
  frontend:               # React/Vite dev server, port 3000
```

- Each Express service has its own Dockerfile (Node image)
- Each Varnish instance has its own VCL config mounted as a volume
- Frontend has its own Dockerfile (Node image running Vite)
- All services on the same Docker network (reference by service name)
- Exposed ports: 3000, 4001, 4002, 8081, 8082

### Seed Data

Each service loads hardcoded seed data on startup: 3-4 teams, 8-10 individuals. Enough to observe caching effects without being overwhelming.

## Project Structure

```
cache-experiments/
├── docker-compose.yml
├── services/
│   ├── directory/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js          # Express app
│   │       └── seed-data.js      # Initial teams
│   └── individuals/
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           ├── index.js          # Express app
│           └── seed-data.js      # Initial individuals
├── varnish/
│   ├── directory.vcl             # VCL for directory Varnish
│   └── individuals.vcl           # VCL for individuals Varnish
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── TeamList.tsx       # Main view: teams with members
        │   ├── TeamCard.tsx       # Single team display
        │   ├── IndividualCard.tsx # Single individual display
        │   ├── EditIndividual.tsx # Edit form for individual info
        │   ├── EditTeamMembers.tsx# Edit team membership
        │   ├── DebugPanel.tsx     # Cache debug info
        │   └── CacheToggle.tsx   # Switch cached/no-cache mode
        ├── hooks/
        │   ├── useTeams.ts       # TanStack queries for teams
        │   └── useIndividuals.ts # TanStack queries for individuals
        └── api/
            └── client.ts         # Axios/fetch wrapper with base URL switching
```
