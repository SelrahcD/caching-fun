# HTTP Caching Experiments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two Express microservices behind Varnish reverse proxies with a React frontend to demonstrate HTTP caching patterns (TTL + ETag + surrogate key purging).

**Architecture:** Two Express services (company directory on port 4001, individuals on port 4002) each sit behind their own Varnish instance (ports 8081, 8082). A React/Vite frontend on port 3000 composes data from both services, with a debug panel showing cache behavior. Docker Compose orchestrates all 5 containers.

**Tech Stack:** Node.js, Express, Varnish 7.x, React 18, Vite, TanStack Query v5, Docker Compose

---

### Task 1: Project Scaffolding & Package Setup

**Files:**
- Create: `services/directory/package.json`
- Create: `services/individuals/package.json`
- Create: `frontend/package.json`

- [ ] **Step 1: Initialize directory service package**

```bash
mkdir -p services/directory/src && cd services/directory
```

Write `services/directory/package.json`:

```json
{
  "name": "directory-service",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5"
  }
}
```

- [ ] **Step 2: Initialize individuals service package**

```bash
mkdir -p services/individuals/src
```

Write `services/individuals/package.json`:

```json
{
  "name": "individuals-service",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5"
  }
}
```

- [ ] **Step 3: Initialize frontend package**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @tanstack/react-query
```

- [ ] **Step 4: Install backend dependencies**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/services/directory && npm install
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/services/individuals && npm install
```

- [ ] **Step 5: Commit**

```bash
git add services/directory/package.json services/directory/package-lock.json \
       services/individuals/package.json services/individuals/package-lock.json \
       frontend/
git commit -m "chore: scaffold project with three packages"
```

---

### Task 2: Individuals Service

**Files:**
- Create: `services/individuals/src/seed-data.js`
- Create: `services/individuals/src/index.js`

- [ ] **Step 1: Write seed data**

Write `services/individuals/src/seed-data.js`:

```js
export const individuals = new Map([
  ["ind-1", { id: "ind-1", firstName: "Alice", lastName: "Martin", avatarId: "avatar-1" }],
  ["ind-2", { id: "ind-2", firstName: "Bob", lastName: "Dupont", avatarId: "avatar-2" }],
  ["ind-3", { id: "ind-3", firstName: "Charlie", lastName: "Bernard", avatarId: "avatar-3" }],
  ["ind-4", { id: "ind-4", firstName: "Diana", lastName: "Leroy", avatarId: "avatar-4" }],
  ["ind-5", { id: "ind-5", firstName: "Eve", lastName: "Moreau", avatarId: "avatar-5" }],
  ["ind-6", { id: "ind-6", firstName: "Frank", lastName: "Simon", avatarId: "avatar-6" }],
  ["ind-7", { id: "ind-7", firstName: "Grace", lastName: "Laurent", avatarId: "avatar-7" }],
  ["ind-8", { id: "ind-8", firstName: "Hugo", lastName: "Roux", avatarId: "avatar-8" }],
]);
```

- [ ] **Step 2: Write the Express app**

Write `services/individuals/src/index.js`:

```js
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { individuals } from "./seed-data.js";

const app = express();
app.use(cors());
app.use(express.json());

function computeEtag(data) {
  return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

// GET /individuals/:id
app.get("/individuals/:id", (req, res) => {
  const individual = individuals.get(req.params.id);
  if (!individual) {
    return res.status(404).json({ error: "Individual not found" });
  }

  const etag = computeEtag(individual);

  // Conditional request: return 304 if ETag matches
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  res.set("Cache-Control", "max-age=60");
  res.set("ETag", etag);
  res.set("X-Xkey", `individual-${individual.id}`);
  res.json(individual);
});

// PUT /individuals/:id
app.put("/individuals/:id", (req, res) => {
  const individual = individuals.get(req.params.id);
  if (!individual) {
    return res.status(404).json({ error: "Individual not found" });
  }

  const { firstName, lastName, avatarId } = req.body;
  if (firstName !== undefined) individual.firstName = firstName;
  if (lastName !== undefined) individual.lastName = lastName;
  if (avatarId !== undefined) individual.avatarId = avatarId;

  individuals.set(req.params.id, individual);

  res.set("X-Purge", `individual-${individual.id}`);
  res.json(individual);
});

const PORT = 4002;
app.listen(PORT, () => {
  console.log(`Individuals service running on port ${PORT}`);
});
```

- [ ] **Step 3: Verify the service starts and responds**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/services/individuals
node src/index.js &
sleep 1
curl -s http://localhost:4002/individuals/ind-1 | head -c 200
kill %1
```

Expected: JSON with Alice's data, plus `Cache-Control`, `ETag`, `X-Xkey` headers.

- [ ] **Step 4: Commit**

```bash
git add services/individuals/src/
git commit -m "feat: add individuals service with GET/PUT and cache headers"
```

---

### Task 3: Company Directory Service

**Files:**
- Create: `services/directory/src/seed-data.js`
- Create: `services/directory/src/index.js`

- [ ] **Step 1: Write seed data**

Write `services/directory/src/seed-data.js`:

```js
export const teams = new Map([
  ["team-1", { id: "team-1", name: "Engineering", memberIds: ["ind-1", "ind-2", "ind-3"] }],
  ["team-2", { id: "team-2", name: "Design", memberIds: ["ind-2", "ind-4", "ind-5"] }],
  ["team-3", { id: "team-3", name: "Product", memberIds: ["ind-5", "ind-6", "ind-7"] }],
  ["team-4", { id: "team-4", name: "Marketing", memberIds: ["ind-7", "ind-8"] }],
]);
```

- [ ] **Step 2: Write the Express app**

Write `services/directory/src/index.js`:

```js
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { teams } from "./seed-data.js";

const app = express();
app.use(cors());
app.use(express.json());

function computeEtag(data) {
  return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

// GET /teams — list all teams (id + name only)
app.get("/teams", (req, res) => {
  const teamList = Array.from(teams.values()).map(({ id, name }) => ({ id, name }));
  const etag = computeEtag(teamList);

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  res.set("Cache-Control", "max-age=60");
  res.set("ETag", etag);
  res.set("X-Xkey", "teams-list");
  res.json(teamList);
});

// GET /teams/:id — single team with memberIds
app.get("/teams/:id", (req, res) => {
  const team = teams.get(req.params.id);
  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }

  const etag = computeEtag(team);

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  res.set("Cache-Control", "max-age=60");
  res.set("ETag", etag);
  res.set("X-Xkey", `team-${team.id}`);
  res.json(team);
});

// PUT /teams/:id/members — update member list
app.put("/teams/:id/members", (req, res) => {
  const team = teams.get(req.params.id);
  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }

  const { memberIds } = req.body;
  if (!Array.isArray(memberIds)) {
    return res.status(400).json({ error: "memberIds must be an array" });
  }

  team.memberIds = memberIds;
  teams.set(req.params.id, team);

  // Purge this team's cache AND the teams list cache
  res.set("X-Purge", `team-${team.id} teams-list`);
  res.json(team);
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Directory service running on port ${PORT}`);
});
```

- [ ] **Step 3: Verify the service starts and responds**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/services/directory
node src/index.js &
sleep 1
curl -s http://localhost:4001/teams | head -c 300
curl -s http://localhost:4001/teams/team-1 | head -c 200
kill %1
```

Expected: JSON list of teams (id+name), and team-1 details with memberIds.

- [ ] **Step 4: Commit**

```bash
git add services/directory/src/
git commit -m "feat: add directory service with GET/PUT and cache headers"
```

---

### Task 4: Varnish VCL Configuration

**Files:**
- Create: `varnish/individuals.vcl`
- Create: `varnish/directory.vcl`

- [ ] **Step 1: Write the individuals Varnish VCL**

Write `varnish/individuals.vcl`:

```vcl
vcl 4.1;

import xkey;

backend default {
    .host = "individuals-service";
    .port = "4002";
}

sub vcl_recv {
    # Only cache GET requests
    if (req.method != "GET") {
        return (pass);
    }
}

sub vcl_backend_response {
    # Store xkey surrogate keys from backend header
    if (beresp.http.X-Xkey) {
        set beresp.http.xkey = beresp.http.X-Xkey;
    }

    # If backend signals a purge, purge by xkey
    if (beresp.http.X-Purge) {
        xkey.purge(beresp.http.X-Purge);
        unset beresp.http.X-Purge;
    }
}

sub vcl_deliver {
    # Add cache hit/miss header for the debug panel
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
    set resp.http.X-Cache-Hits = obj.hits;

    # Remove internal headers
    unset resp.http.X-Xkey;
}
```

- [ ] **Step 2: Write the directory Varnish VCL**

Write `varnish/directory.vcl`:

```vcl
vcl 4.1;

import xkey;

backend default {
    .host = "directory-service";
    .port = "4001";
}

sub vcl_recv {
    if (req.method != "GET") {
        return (pass);
    }
}

sub vcl_backend_response {
    if (beresp.http.X-Xkey) {
        set beresp.http.xkey = beresp.http.X-Xkey;
    }

    if (beresp.http.X-Purge) {
        # X-Purge may contain space-separated keys (e.g., "team-1 teams-list")
        xkey.purge(beresp.http.X-Purge);
        unset beresp.http.X-Purge;
    }
}

sub vcl_deliver {
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
    set resp.http.X-Cache-Hits = obj.hits;
    unset resp.http.X-Xkey;
}
```

**Note:** The `xkey` VMOD uses the header named `xkey` (lowercase) by convention to tag objects. The backend sets `X-Xkey` as a custom header, and the VCL copies it to the `xkey` header that the VMOD reads. The `xkey.purge()` call purges all objects tagged with the given key.

- [ ] **Step 3: Commit**

```bash
git add varnish/
git commit -m "feat: add Varnish VCL configs with xkey purging"
```

---

### Task 5: Dockerfiles

**Files:**
- Create: `services/directory/Dockerfile`
- Create: `services/individuals/Dockerfile`
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Write the directory service Dockerfile**

Write `services/directory/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY src/ src/
EXPOSE 4001
CMD ["node", "src/index.js"]
```

- [ ] **Step 2: Write the individuals service Dockerfile**

Write `services/individuals/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY src/ src/
EXPOSE 4002
CMD ["node", "src/index.js"]
```

- [ ] **Step 3: Write the frontend Dockerfile**

Write `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
```

- [ ] **Step 4: Commit**

```bash
git add services/directory/Dockerfile services/individuals/Dockerfile frontend/Dockerfile
git commit -m "chore: add Dockerfiles for all services and frontend"
```

---

### Task 6: Docker Compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Write docker-compose.yml**

Write `docker-compose.yml`:

```yaml
services:
  directory-service:
    build: ./services/directory
    ports:
      - "4001:4001"

  individuals-service:
    build: ./services/individuals
    ports:
      - "4002:4002"

  varnish-directory:
    image: varnish:7.6
    ports:
      - "8081:80"
    volumes:
      - ./varnish/directory.vcl:/etc/varnish/default.vcl:ro
    depends_on:
      - directory-service
    command: >
      varnishd
      -F
      -a :80
      -f /etc/varnish/default.vcl
      -s malloc,256m
      -p feature=+http2

  varnish-individuals:
    image: varnish:7.6
    ports:
      - "8082:80"
    volumes:
      - ./varnish/individuals.vcl:/etc/varnish/default.vcl:ro
    depends_on:
      - individuals-service
    command: >
      varnishd
      -F
      -a :80
      -f /etc/varnish/default.vcl
      -s malloc,256m
      -p feature=+http2

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - varnish-directory
      - varnish-individuals
```

- [ ] **Step 2: Verify Docker Compose config is valid**

```bash
docker compose config --quiet
```

Expected: no output (valid config).

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add Docker Compose for all services"
```

---

### Task 7: Frontend — API Client & Cache Config

**Files:**
- Create: `frontend/src/api/client.ts`
- Modify: `frontend/src/main.tsx` (wrap with QueryClientProvider)

- [ ] **Step 1: Write the API client with base URL switching**

Write `frontend/src/api/client.ts`:

```ts
const DIRECTORY_CACHED = "http://localhost:8081";
const DIRECTORY_DIRECT = "http://localhost:4001";
const INDIVIDUALS_CACHED = "http://localhost:8082";
const INDIVIDUALS_DIRECT = "http://localhost:4002";

let cacheEnabled = true;

export function setCacheEnabled(enabled: boolean) {
  cacheEnabled = enabled;
}

export function isCacheEnabled(): boolean {
  return cacheEnabled;
}

function directoryBase(): string {
  return cacheEnabled ? DIRECTORY_CACHED : DIRECTORY_DIRECT;
}

function individualsBase(): string {
  return cacheEnabled ? INDIVIDUALS_CACHED : INDIVIDUALS_DIRECT;
}

export interface RequestLog {
  url: string;
  method: string;
  status: number;
  duration: number;
  xCache: string | null;
  age: string | null;
  etag: string | null;
  timestamp: number;
}

type RequestLogListener = (log: RequestLog) => void;

const listeners: RequestLogListener[] = [];

export function onRequestLog(listener: RequestLogListener): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

async function trackedFetch(url: string, options?: RequestInit): Promise<Response> {
  const start = performance.now();
  const response = await fetch(url, options);
  const duration = Math.round(performance.now() - start);

  const log: RequestLog = {
    url,
    method: options?.method ?? "GET",
    status: response.status,
    duration,
    xCache: response.headers.get("X-Cache"),
    age: response.headers.get("Age"),
    etag: response.headers.get("ETag"),
    timestamp: Date.now(),
  };

  listeners.forEach((listener) => listener(log));

  return response;
}

// --- Directory API ---

export interface TeamSummary {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  memberIds: string[];
}

export async function fetchTeams(): Promise<TeamSummary[]> {
  const res = await trackedFetch(`${directoryBase()}/teams`);
  return res.json();
}

export async function fetchTeam(id: string): Promise<Team> {
  const res = await trackedFetch(`${directoryBase()}/teams/${id}`);
  return res.json();
}

export async function updateTeamMembers(
  id: string,
  memberIds: string[]
): Promise<Team> {
  const res = await trackedFetch(`${directoryBase()}/teams/${id}/members`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberIds }),
  });
  return res.json();
}

// --- Individuals API ---

export interface Individual {
  id: string;
  firstName: string;
  lastName: string;
  avatarId: string;
}

export async function fetchIndividual(id: string): Promise<Individual> {
  const res = await trackedFetch(`${individualsBase()}/individuals/${id}`);
  return res.json();
}

export async function updateIndividual(
  id: string,
  data: Partial<Omit<Individual, "id">>
): Promise<Individual> {
  const res = await trackedFetch(`${individualsBase()}/individuals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
```

- [ ] **Step 2: Set up QueryClientProvider in main.tsx**

Replace the contents of `frontend/src/main.tsx` with:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export { queryClient };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/client.ts frontend/src/main.tsx
git commit -m "feat: add API client with cache toggle and request logging"
```

---

### Task 8: Frontend — TanStack Query Hooks

**Files:**
- Create: `frontend/src/hooks/useTeams.ts`
- Create: `frontend/src/hooks/useIndividuals.ts`

- [ ] **Step 1: Write useTeams hook**

Write `frontend/src/hooks/useTeams.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTeams, fetchTeam, updateTeamMembers } from "../api/client";

export function useTeamList() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ["team", id],
    queryFn: () => fetchTeam(id),
  });
}

export function useUpdateTeamMembers(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberIds: string[]) => updateTeamMembers(teamId, memberIds),
    onSuccess: (updatedTeam) => {
      // Approach 1: Optimistic — update local cache directly
      queryClient.setQueryData(["team", teamId], updatedTeam);
      // Approach 2: Invalidate — triggers refetch (cache MISS on Varnish since backend purged)
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}
```

- [ ] **Step 2: Write useIndividuals hook**

Write `frontend/src/hooks/useIndividuals.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIndividual,
  updateIndividual,
  Individual,
} from "../api/client";

export function useIndividual(id: string) {
  return useQuery({
    queryKey: ["individual", id],
    queryFn: () => fetchIndividual(id),
  });
}

export function useUpdateIndividual(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Omit<Individual, "id">>) =>
      updateIndividual(id, data),
    onSuccess: (updatedIndividual) => {
      // Approach 1: Optimistic — update local cache directly
      queryClient.setQueryData(["individual", id], updatedIndividual);
      // Approach 2: Invalidate — triggers refetch through Varnish (will be a MISS since backend purged)
      queryClient.invalidateQueries({ queryKey: ["individual", id] });
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/
git commit -m "feat: add TanStack Query hooks for teams and individuals"
```

---

### Task 9: Frontend — Debug Panel Component

**Files:**
- Create: `frontend/src/components/DebugPanel.tsx`

- [ ] **Step 1: Write the debug panel**

Write `frontend/src/components/DebugPanel.tsx`:

```tsx
import { useEffect, useState } from "react";
import { onRequestLog, RequestLog } from "../api/client";

export function DebugPanel() {
  const [logs, setLogs] = useState<RequestLog[]>([]);

  useEffect(() => {
    const unsubscribe = onRequestLog((log) => {
      setLogs((prev) => [log, ...prev].slice(0, 50));
    });
    return unsubscribe;
  }, []);

  const totalRequests = logs.length;
  const cacheHits = logs.filter((l) => l.xCache === "HIT").length;
  const hitRatio =
    totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "300px",
        overflow: "auto",
        background: "#1a1a2e",
        color: "#eee",
        fontSize: "12px",
        fontFamily: "monospace",
        borderTop: "2px solid #444",
        padding: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "8px",
          fontWeight: "bold",
        }}
      >
        <span>Requests: {totalRequests}</span>
        <span style={{ color: "#4caf50" }}>Hits: {cacheHits}</span>
        <span style={{ color: "#f44336" }}>
          Misses: {totalRequests - cacheHits}
        </span>
        <span>Hit Ratio: {hitRatio}%</span>
        <button
          onClick={() => setLogs([])}
          style={{
            marginLeft: "auto",
            background: "#333",
            color: "#eee",
            border: "1px solid #555",
            borderRadius: "4px",
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #444", textAlign: "left" }}>
            <th style={{ padding: "4px" }}>Method</th>
            <th style={{ padding: "4px" }}>URL</th>
            <th style={{ padding: "4px" }}>Status</th>
            <th style={{ padding: "4px" }}>Time</th>
            <th style={{ padding: "4px" }}>Cache</th>
            <th style={{ padding: "4px" }}>Age</th>
            <th style={{ padding: "4px" }}>ETag</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={log.timestamp + "-" + i} style={{ borderBottom: "1px solid #333" }}>
              <td style={{ padding: "4px" }}>{log.method}</td>
              <td style={{ padding: "4px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {log.url}
              </td>
              <td style={{ padding: "4px" }}>{log.status}</td>
              <td style={{ padding: "4px" }}>{log.duration}ms</td>
              <td
                style={{
                  padding: "4px",
                  color: log.xCache === "HIT" ? "#4caf50" : log.xCache === "MISS" ? "#f44336" : "#888",
                  fontWeight: "bold",
                }}
              >
                {log.xCache ?? "-"}
              </td>
              <td style={{ padding: "4px" }}>{log.age ?? "-"}</td>
              <td style={{ padding: "4px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {log.etag ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/DebugPanel.tsx
git commit -m "feat: add debug panel showing cache hit/miss and request stats"
```

---

### Task 10: Frontend — Cache Toggle Component

**Files:**
- Create: `frontend/src/components/CacheToggle.tsx`

- [ ] **Step 1: Write the cache toggle**

Write `frontend/src/components/CacheToggle.tsx`:

```tsx
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setCacheEnabled, isCacheEnabled } from "../api/client";

export function CacheToggle() {
  const [enabled, setEnabled] = useState(isCacheEnabled());
  const queryClient = useQueryClient();

  const toggle = () => {
    const next = !enabled;
    setCacheEnabled(next);
    setEnabled(next);
    queryClient.clear();
  };

  return (
    <button
      onClick={toggle}
      style={{
        padding: "8px 16px",
        background: enabled ? "#4caf50" : "#f44336",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Cache: {enabled ? "ON (Varnish)" : "OFF (Direct)"}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/CacheToggle.tsx
git commit -m "feat: add cache toggle switch component"
```

---

### Task 11: Frontend — Individual and Team Display Components

**Files:**
- Create: `frontend/src/components/IndividualCard.tsx`
- Create: `frontend/src/components/TeamCard.tsx`
- Create: `frontend/src/components/TeamList.tsx`

- [ ] **Step 1: Write IndividualCard**

Write `frontend/src/components/IndividualCard.tsx`:

```tsx
import { Individual } from "../api/client";

interface IndividualCardProps {
  individual: Individual;
  onEdit: (individual: Individual) => void;
}

export function IndividualCard({ individual, onEdit }: IndividualCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 12px",
        background: "#f5f5f5",
        borderRadius: "6px",
        marginBottom: "4px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: "bold",
          color: "#666",
        }}
      >
        {individual.firstName[0]}
        {individual.lastName[0]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>
          {individual.firstName} {individual.lastName}
        </div>
        <div style={{ fontSize: "12px", color: "#888" }}>{individual.id}</div>
      </div>
      <button
        onClick={() => onEdit(individual)}
        style={{
          padding: "4px 12px",
          background: "#2196f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        Edit
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write TeamCard**

Write `frontend/src/components/TeamCard.tsx`:

```tsx
import { useTeam } from "../hooks/useTeams";
import { useIndividual } from "../hooks/useIndividuals";
import { IndividualCard } from "./IndividualCard";
import { Individual } from "../api/client";

interface TeamCardProps {
  teamId: string;
  teamName: string;
  onEditIndividual: (individual: Individual) => void;
  onEditTeam: (teamId: string) => void;
}

function IndividualLoader({
  id,
  onEdit,
}: {
  id: string;
  onEdit: (individual: Individual) => void;
}) {
  const { data, isLoading, error } = useIndividual(id);

  if (isLoading) return <div style={{ padding: "8px", color: "#888" }}>Loading {id}...</div>;
  if (error) return <div style={{ padding: "8px", color: "red" }}>Error loading {id}</div>;
  if (!data) return null;

  return <IndividualCard individual={data} onEdit={onEdit} />;
}

export function TeamCard({ teamId, teamName, onEditIndividual, onEditTeam }: TeamCardProps) {
  const { data: team, isLoading, error } = useTeam(teamId);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
        background: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
        <h2 style={{ margin: 0, flex: 1 }}>{teamName}</h2>
        <button
          onClick={() => onEditTeam(teamId)}
          style={{
            padding: "4px 12px",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Edit Members
        </button>
      </div>

      {isLoading && <div>Loading team details...</div>}
      {error && <div style={{ color: "red" }}>Error loading team</div>}
      {team && (
        <div>
          {team.memberIds.map((id) => (
            <IndividualLoader key={id} id={id} onEdit={onEditIndividual} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write TeamList**

Write `frontend/src/components/TeamList.tsx`:

```tsx
import { useTeamList } from "../hooks/useTeams";
import { TeamCard } from "./TeamCard";
import { Individual } from "../api/client";

interface TeamListProps {
  onEditIndividual: (individual: Individual) => void;
  onEditTeam: (teamId: string) => void;
}

export function TeamList({ onEditIndividual, onEditTeam }: TeamListProps) {
  const { data: teams, isLoading, error } = useTeamList();

  if (isLoading) return <div>Loading teams...</div>;
  if (error) return <div style={{ color: "red" }}>Error loading teams</div>;
  if (!teams) return null;

  return (
    <div>
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          teamId={team.id}
          teamName={team.name}
          onEditIndividual={onEditIndividual}
          onEditTeam={onEditTeam}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/IndividualCard.tsx \
       frontend/src/components/TeamCard.tsx \
       frontend/src/components/TeamList.tsx
git commit -m "feat: add team and individual display components"
```

---

### Task 12: Frontend — Edit Forms

**Files:**
- Create: `frontend/src/components/EditIndividual.tsx`
- Create: `frontend/src/components/EditTeamMembers.tsx`

- [ ] **Step 1: Write EditIndividual**

Write `frontend/src/components/EditIndividual.tsx`:

```tsx
import { useState } from "react";
import { useUpdateIndividual } from "../hooks/useIndividuals";
import { Individual } from "../api/client";

interface EditIndividualProps {
  individual: Individual;
  onClose: () => void;
}

export function EditIndividual({ individual, onClose }: EditIndividualProps) {
  const [firstName, setFirstName] = useState(individual.firstName);
  const [lastName, setLastName] = useState(individual.lastName);
  const mutation = useUpdateIndividual(individual.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ firstName, lastName }, { onSuccess: onClose });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "8px",
          minWidth: "300px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Edit {individual.firstName} {individual.lastName}</h3>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            First Name
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            Last Name
          </label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", background: "white" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            style={{ padding: "8px 16px", background: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Write EditTeamMembers**

Write `frontend/src/components/EditTeamMembers.tsx`:

```tsx
import { useState } from "react";
import { useTeam, useUpdateTeamMembers } from "../hooks/useTeams";

const ALL_INDIVIDUAL_IDS = [
  "ind-1", "ind-2", "ind-3", "ind-4",
  "ind-5", "ind-6", "ind-7", "ind-8",
];

interface EditTeamMembersProps {
  teamId: string;
  onClose: () => void;
}

export function EditTeamMembers({ teamId, onClose }: EditTeamMembersProps) {
  const { data: team } = useTeam(teamId);
  const [memberIds, setMemberIds] = useState<string[]>(team?.memberIds ?? []);
  const mutation = useUpdateTeamMembers(teamId);

  const toggleMember = (id: string) => {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(memberIds, { onSuccess: onClose });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "8px",
          minWidth: "300px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Edit Members: {team?.name}</h3>
        <div style={{ marginBottom: "16px" }}>
          {ALL_INDIVIDUAL_IDS.map((id) => (
            <label
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 0",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={memberIds.includes(id)}
                onChange={() => toggleMember(id)}
              />
              {id}
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", background: "white" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            style={{ padding: "8px 16px", background: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/EditIndividual.tsx \
       frontend/src/components/EditTeamMembers.tsx
git commit -m "feat: add edit forms for individuals and team members"
```

---

### Task 13: Frontend — App Shell (Wiring Everything Together)

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Wire up App.tsx**

Replace contents of `frontend/src/App.tsx` with:

```tsx
import { useState } from "react";
import { TeamList } from "./components/TeamList";
import { EditIndividual } from "./components/EditIndividual";
import { EditTeamMembers } from "./components/EditTeamMembers";
import { DebugPanel } from "./components/DebugPanel";
import { CacheToggle } from "./components/CacheToggle";
import { Individual } from "./api/client";

function App() {
  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  return (
    <div style={{ padding: "24px", paddingBottom: "320px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <h1 style={{ margin: 0, flex: 1 }}>Company Directory</h1>
        <CacheToggle />
      </div>

      <TeamList
        onEditIndividual={setEditingIndividual}
        onEditTeam={setEditingTeamId}
      />

      {editingIndividual && (
        <EditIndividual
          individual={editingIndividual}
          onClose={() => setEditingIndividual(null)}
        />
      )}

      {editingTeamId && (
        <EditTeamMembers
          teamId={editingTeamId}
          onClose={() => setEditingTeamId(null)}
        />
      )}

      <DebugPanel />
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: wire up App shell with all components"
```

---

### Task 14: Integration — Build and Smoke Test

- [ ] **Step 1: Start the full stack with Docker Compose**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments
docker compose up --build -d
```

Expected: All 5 containers start successfully.

- [ ] **Step 2: Verify backend services respond**

```bash
curl -s http://localhost:4001/teams | python3 -m json.tool
curl -s http://localhost:4002/individuals/ind-1 | python3 -m json.tool
```

Expected: JSON responses with seed data.

- [ ] **Step 3: Verify Varnish proxying works**

```bash
curl -s -D- http://localhost:8081/teams | head -20
curl -s -D- http://localhost:8082/individuals/ind-1 | head -20
```

Expected: JSON responses with `X-Cache: MISS` on first request. Headers include `Cache-Control`, `ETag`, `Age`.

- [ ] **Step 4: Verify cache HIT on second request**

```bash
curl -s -D- http://localhost:8081/teams | head -10
curl -s -D- http://localhost:8082/individuals/ind-1 | head -10
```

Expected: `X-Cache: HIT` and `Age` > 0.

- [ ] **Step 5: Verify cache purge on PUT**

```bash
curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"firstName":"Alicia"}' \
  http://localhost:8082/individuals/ind-1 | python3 -m json.tool
# Now fetch again — should be a MISS (purged)
curl -s -D- http://localhost:8082/individuals/ind-1 | head -10
```

Expected: PUT returns updated data. Next GET returns `X-Cache: MISS` with `firstName: "Alicia"`.

- [ ] **Step 6: Open frontend in browser**

Open `http://localhost:3000` in browser. Verify:
- Teams display with individual names
- Debug panel shows requests with HIT/MISS
- Edit individual → name updates immediately
- Toggle cache OFF → debug panel shows no X-Cache headers

- [ ] **Step 7: Commit any fixes needed**

```bash
git add -A
git commit -m "fix: integration adjustments from smoke testing"
```

(Skip this step if no fixes were needed.)

---

### Task 15: Vite Proxy Configuration (CORS fix for development)

**Files:**
- Modify: `frontend/vite.config.ts`

Note: This task exists because the frontend running in the browser at `localhost:3000` makes requests to `localhost:8081` and `localhost:8082`, which are different origins. The `X-Cache`, `Age`, and `ETag` headers also need to be exposed via CORS. The backends already use the `cors` middleware, but Varnish doesn't add CORS headers. Rather than configuring CORS in VCL, we can use Vite's dev proxy to route all API calls through the same origin.

However, since the whole point is to switch between Varnish and direct ports, and both backends already have `cors()`, the simplest fix is to ensure Varnish passes through CORS headers and also exposes custom headers.

- [ ] **Step 1: Add CORS headers in Varnish VCL**

Add to `vcl_deliver` in both `varnish/directory.vcl` and `varnish/individuals.vcl`, before the closing `}`:

In `varnish/directory.vcl`, replace the entire `vcl_deliver` sub with:

```vcl
sub vcl_deliver {
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
    set resp.http.X-Cache-Hits = obj.hits;
    unset resp.http.X-Xkey;

    # CORS headers
    set resp.http.Access-Control-Allow-Origin = "*";
    set resp.http.Access-Control-Allow-Methods = "GET, PUT, OPTIONS";
    set resp.http.Access-Control-Allow-Headers = "Content-Type";
    set resp.http.Access-Control-Expose-Headers = "X-Cache, X-Cache-Hits, Age, ETag";
}
```

In `varnish/individuals.vcl`, replace the entire `vcl_deliver` sub with the same block above.

Also add CORS preflight handling in `vcl_recv` in both VCL files. Add at the top of `vcl_recv`, before the GET check:

```vcl
    # Handle CORS preflight
    if (req.method == "OPTIONS") {
        return (synth(204, "No Content"));
    }
```

And add a `vcl_synth` sub to both VCL files:

```vcl
sub vcl_synth {
    if (resp.status == 204) {
        set resp.http.Access-Control-Allow-Origin = "*";
        set resp.http.Access-Control-Allow-Methods = "GET, PUT, OPTIONS";
        set resp.http.Access-Control-Allow-Headers = "Content-Type";
        set resp.http.Access-Control-Expose-Headers = "X-Cache, X-Cache-Hits, Age, ETag";
        return (deliver);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add varnish/
git commit -m "fix: add CORS support in Varnish VCL for browser requests"
```
