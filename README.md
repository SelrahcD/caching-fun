# HTTP Caching Experiments

A hands-on learning project to understand HTTP caching patterns using two microservices, Varnish reverse proxies, and a React frontend.

## Architecture

```
Browser (React + TanStack Query)
    │                    │
    ▼                    ▼
Varnish :8081       Varnish :8082
    │                    │
    ▼                    ▼
Directory :4001    Individuals :4002
```

- **Company Directory Service** — teams with member IDs (Express, port 4001)
- **Individuals Service** — person info: name, avatar (Express, port 4002)
- **Varnish** — one instance per service, handles TTL caching, ETag revalidation, and surrogate key purging
- **React Frontend** — composes data from both services, with a cache toggle and an interactive learn page

## Caching Strategy

- **TTL**: `Cache-Control: max-age=60` — Varnish serves cached responses for 60 seconds
- **ETag**: content hash for conditional revalidation — when TTL expires, Varnish asks the backend "has it changed?" via `If-None-Match`
- **Surrogate Key Purging**: backends send `X-Purge` headers on writes, Varnish uses `xkey` to evict specific cached entries
- **Cache Toggle**: switch between Varnish (cached) and direct backend (uncached) to compare behavior

## Getting Started

```bash
docker compose up --build -d
```

Open http://localhost:3000 to use the app, or http://localhost:3000/learn for the interactive caching tutorial.

## Learn Page

The `/learn` page is an interactive tutorial that teaches HTTP caching from scratch. Step through 6 animated scenarios:

1. **First Load** — cold cache, all requests miss
2. **Reload within TTL** — Varnish serves from cache
3. **ETag Revalidation** — TTL expired, 304 Not Modified
4. **Edit Individual** — PUT triggers cache purge via surrogate keys
5. **Edit Team Members** — targeted purge of specific team cache
6. **Cache OFF** — bypass Varnish, direct to backend

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React app with TanStack Query |
| Varnish (Directory) | 8081 | Cache proxy for teams API |
| Varnish (Individuals) | 8082 | Cache proxy for individuals API |
| Directory Service | 4001 | Teams API (Express) |
| Individuals Service | 4002 | Individuals API (Express) |

## Tech Stack

Node.js, Express, Varnish 7.x, React 19, Vite, TanStack Query, Docker Compose
