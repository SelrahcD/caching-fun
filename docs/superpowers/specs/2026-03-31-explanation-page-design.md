# Explanation Page — Design Spec

## Purpose

An interactive learning page at `/learn` that teaches HTTP caching from scratch. Users step through animated scenarios showing how requests flow through Browser → Varnish → Backend, with visual feedback on cache hits, misses, ETags, and purges.

## Target Audience

Someone new to HTTP caching. No prior knowledge assumed.

## Navigation

A nav bar at the top of the app with two links: **App** (`/`) and **Learn** (`/learn`). Uses React Router for client-side routing.

## Page Layout

Top-to-bottom, single column:

1. **Scenario picker** — horizontal pills (1-6), active scenario highlighted in green
2. **Architecture diagram** — three boxes (Browser, Varnish, Express) connected by animated arrows
3. **Step explanation card** — numbered step with title and description text
4. **Step controls** — Previous / step counter / Next buttons
5. **Log panel** — accumulates request log entries as the user steps through

## Architecture Diagram

Three boxes arranged horizontally:

- **Browser** (blue border) — labeled "TanStack Query" underneath
- **Varnish** (orange border) — shows HIT/MISS status below, changes color (green for HIT, red for MISS)
- **Express** (purple border) — labeled "In-memory data" underneath

Arrows between boxes animate to show request direction:
- A green pulse travels along the arrow from source to destination
- Arrow label shows the HTTP method and path (e.g., "GET /teams")
- Response arrows travel back the other direction
- When a step doesn't involve a component, it dims (opacity)

## Scenarios

### 1. First Load (Cold Cache)
Steps:
1. Browser sends `GET /teams` to Varnish
2. Varnish has no cached copy → **MISS** → forwards to Express
3. Express returns JSON with `Cache-Control: max-age=60`, `ETag`, `X-Xkey: teams-list`
4. Varnish stores the response, tags it with xkey, forwards to Browser
5. Browser renders the data. TanStack Query caches it locally (staleTime: 60s).

### 2. Reload Within TTL
Steps:
1. Browser sends `GET /teams` with `Cache-Control: no-cache` (revalidation)
2. Varnish has a cached copy, TTL not expired → **HIT**
3. Varnish returns cached response with `Age` header showing how old it is
4. Browser gets fast response (no backend call). Diagram shows Express dimmed.

### 3. TTL Expired — ETag Revalidation
Steps:
1. 60 seconds have passed. Browser sends `GET /teams`.
2. Varnish TTL expired → forwards to Express with `If-None-Match: <etag>`
3. Express checks: data unchanged → returns `304 Not Modified` (no body)
4. Varnish refreshes its TTL, serves cached response to Browser
5. Fast response — only headers transmitted, no data re-sent

### 4. Edit an Individual
Steps:
1. Browser sends `PUT /individuals/ind-1` with `{firstName: "Alicia"}` through Varnish
2. Varnish passes through (PUT is never cached) → Express updates in-memory data
3. Express responds with updated individual + `X-Purge: individual-ind-1`
4. Varnish sees `X-Purge` header → evicts cached `individual-ind-1` from cache
5. TanStack Query optimistically updates local cache — UI shows "Alicia" immediately
6. Next `GET /individuals/ind-1` → Varnish **MISS** → fresh data from Express

### 5. Edit Team Members
Steps:
1. Browser sends `PUT /teams/team-1/members` with new member list through Varnish
2. Varnish passes through → Express updates team membership
3. Express responds with `X-Purge: team-team-1` → Varnish evicts that team's cache
4. TanStack Query updates local cache with response data
5. Next `GET /teams/team-1` → Varnish **MISS** → returns team with new members

### 6. Cache OFF (Direct to Backend)
Steps:
1. User toggles cache OFF — frontend switches base URL from port 8081/8082 to 4001/4002
2. Browser sends `GET /teams` directly to Express (port 4001)
3. Express returns data — no Varnish involved. Diagram shows Varnish dimmed/crossed out.
4. Every request hits Express directly — no caching layer, always fresh but slower.

## Animations

CSS animations only (no external libraries):

- **Arrow pulse**: a colored dot (::after pseudo-element) travels along the arrow using `@keyframes` translateX. Duration ~800ms.
- **Box highlight**: when a component is active in the current step, its border glows (box-shadow pulse). When inactive, it dims (opacity: 0.3).
- **HIT/MISS badge**: fades in below Varnish box with color (green/red). Scales up slightly on appear.
- **Log entry**: slides in from the right when a step adds a log line.
- **Step transition**: step card content fades out/in on Previous/Next (opacity transition ~200ms).

## Log Panel

Monospace, dark background. Each entry shows:
- Cache status (colored: HIT green, MISS red)
- HTTP method + path
- Response status code
- Duration
- Relevant headers (ETag, Age, X-Purge)

Entries accumulate as the user steps forward, clear when switching scenarios.

## File Structure

```
frontend/src/
├── pages/
│   ├── AppPage.tsx        # Current app (moved from App.tsx root)
│   └── LearnPage.tsx      # Explanation page shell
├── learn/
│   ├── Diagram.tsx        # Architecture diagram (3 boxes + arrows)
│   ├── Arrow.tsx          # Animated arrow between boxes
│   ├── ScenarioPicker.tsx # Horizontal pill buttons
│   ├── StepCard.tsx       # Step explanation with number + text
│   ├── StepControls.tsx   # Previous / counter / Next
│   ├── LogPanel.tsx       # Request log entries
│   └── scenarios.ts       # Scenario data: steps, diagram states, log entries
├── components/
│   ├── NavBar.tsx         # App / Learn navigation
│   └── ... (existing components)
└── App.tsx                # React Router: / → AppPage, /learn → LearnPage
```

## Tech

- React Router (`react-router-dom`) for `/` and `/learn` routes
- CSS animations (keyframes) — no animation libraries
- All scenario data in `scenarios.ts` as plain objects
- No backend calls from the learn page — everything is client-side simulation
