# Explanation Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive learning page at `/learn` that teaches HTTP caching through animated step-by-step scenarios.

**Architecture:** A new `/learn` route renders a self-contained page with an architecture diagram (Browser → Varnish → Express), scenario picker, and step-through controls. All scenario data is static (no backend calls). CSS keyframe animations show request flow. React Router handles navigation between the app and learn pages.

**Tech Stack:** React 19, React Router 7, CSS keyframe animations, TypeScript

---

### Task 1: Install React Router & Set Up Routing

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/pages/AppPage.tsx`
- Create: `frontend/src/components/NavBar.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Install react-router-dom**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/frontend
npm install react-router-dom
```

- [ ] **Step 2: Create NavBar component**

Write `frontend/src/components/NavBar.tsx`:

```tsx
import { NavLink } from "react-router-dom";

const linkStyle = {
  color: "#888",
  textDecoration: "none",
  padding: "4px 0",
  fontSize: "14px",
};

const activeLinkStyle = {
  ...linkStyle,
  color: "#fff",
  borderBottom: "2px solid #4caf50",
};

export function NavBar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "24px",
        padding: "12px 24px",
        background: "#16213e",
        borderBottom: "1px solid #333",
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: "bold", color: "#4caf50", fontSize: "14px" }}>
        Cache Experiments
      </span>
      <NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)} end>
        App
      </NavLink>
      <NavLink to="/learn" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        Learn
      </NavLink>
    </nav>
  );
}
```

- [ ] **Step 3: Move current App content to AppPage**

Write `frontend/src/pages/AppPage.tsx`:

```tsx
import { useState } from "react";
import { TeamList } from "../components/TeamList";
import { EditIndividual } from "../components/EditIndividual";
import { EditTeamMembers } from "../components/EditTeamMembers";
import { CacheToggle } from "../components/CacheToggle";
import type { Individual } from "../api/client";

export function AppPage() {
  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
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
    </div>
  );
}
```

- [ ] **Step 4: Rewrite App.tsx with React Router**

Replace `frontend/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { AppPage } from "./pages/AppPage";

function LearnPagePlaceholder() {
  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Learn HTTP Caching</h1>
      <p>Coming soon...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<AppPage />} />
        <Route path="/learn" element={<LearnPagePlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 5: Verify it compiles**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/frontend
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: add React Router with NavBar and App/Learn routes"
```

---

### Task 2: Scenario Data

**Files:**
- Create: `frontend/src/learn/scenarios.ts`

- [ ] **Step 1: Write scenario data**

Write `frontend/src/learn/scenarios.ts`:

```ts
export interface LogEntry {
  status: "HIT" | "MISS" | "304" | "200" | "PASS";
  method: string;
  path: string;
  responseStatus: number;
  duration: string;
  headers: string;
}

export interface DiagramState {
  browserActive: boolean;
  varnishActive: boolean;
  expressActive: boolean;
  varnishStatus: "HIT" | "MISS" | "PASS" | null;
  arrowBrowserToVarnish: boolean;
  arrowVarnishToExpress: boolean;
  arrowExpressToVarnish: boolean;
  arrowVarnishToBrowser: boolean;
  arrowBrowserToExpress: boolean;
  arrowExpressToBrowser: boolean;
  arrowLabel: string | null;
  responseLabel: string | null;
}

export interface Step {
  title: string;
  description: string;
  diagram: DiagramState;
  log: LogEntry | null;
}

export interface Scenario {
  id: string;
  name: string;
  shortName: string;
  steps: Step[];
}

const inactiveDiagram: DiagramState = {
  browserActive: false,
  varnishActive: false,
  expressActive: false,
  varnishStatus: null,
  arrowBrowserToVarnish: false,
  arrowVarnishToExpress: false,
  arrowExpressToVarnish: false,
  arrowVarnishToBrowser: false,
  arrowBrowserToExpress: false,
  arrowExpressToBrowser: false,
  arrowLabel: null,
  responseLabel: null,
};

export const scenarios: Scenario[] = [
  {
    id: "first-load",
    name: "First Load (Cold Cache)",
    shortName: "1. First Load",
    steps: [
      {
        title: "Browser sends GET /teams to Varnish",
        description:
          "The browser has no cached copy yet. TanStack Query fires a fetch to the Varnish proxy at port 8081.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          arrowBrowserToVarnish: true,
          arrowLabel: "GET /teams",
        },
        log: null,
      },
      {
        title: "Varnish: MISS — forwards to Express",
        description:
          "Varnish checks its cache — empty. It forwards the request to the Express backend on port 4001.",
        diagram: {
          ...inactiveDiagram,
          varnishActive: true,
          expressActive: true,
          varnishStatus: "MISS",
          arrowVarnishToExpress: true,
          arrowLabel: "GET /teams",
        },
        log: null,
      },
      {
        title: "Express returns data with cache headers",
        description:
          'Express returns the JSON response with Cache-Control: max-age=60, an ETag (content hash), and X-Xkey: teams-list (surrogate key for targeted purging).',
        diagram: {
          ...inactiveDiagram,
          expressActive: true,
          varnishActive: true,
          arrowExpressToVarnish: true,
          responseLabel: "200 + ETag + Cache-Control: max-age=60",
        },
        log: null,
      },
      {
        title: "Varnish stores and forwards response",
        description:
          "Varnish caches the response, tags it with the xkey surrogate key, and forwards it to the browser. Future requests for /teams will be served from this cache.",
        diagram: {
          ...inactiveDiagram,
          varnishActive: true,
          browserActive: true,
          arrowVarnishToBrowser: true,
          responseLabel: "200 + X-Cache: MISS",
        },
        log: {
          status: "MISS",
          method: "GET",
          path: "/teams",
          responseStatus: 200,
          duration: "28ms",
          headers: "ETag: fb089ab...",
        },
      },
      {
        title: "Browser renders the data",
        description:
          "TanStack Query stores the response in its local cache with staleTime: 60s. The teams are displayed in the UI.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
        },
        log: null,
      },
    ],
  },
  {
    id: "reload-ttl",
    name: "Reload Within TTL",
    shortName: "2. Reload (TTL)",
    steps: [
      {
        title: "Browser sends GET /teams to Varnish",
        description:
          'The user reloads the page. The browser sends a request with Cache-Control: no-cache to force revalidation (but still allows cached responses).',
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          arrowBrowserToVarnish: true,
          arrowLabel: "GET /teams",
        },
        log: null,
      },
      {
        title: "Varnish: HIT — TTL still valid",
        description:
          "Varnish has a cached copy from the first load. The TTL (60s) hasn't expired yet. No need to contact the backend.",
        diagram: {
          ...inactiveDiagram,
          varnishActive: true,
          varnishStatus: "HIT",
        },
        log: null,
      },
      {
        title: "Varnish returns cached response",
        description:
          'Varnish sends the cached response with X-Cache: HIT and an Age header showing how many seconds old the cached response is.',
        diagram: {
          ...inactiveDiagram,
          varnishActive: true,
          browserActive: true,
          varnishStatus: "HIT",
          arrowVarnishToBrowser: true,
          responseLabel: "200 + X-Cache: HIT + Age: 15",
        },
        log: {
          status: "HIT",
          method: "GET",
          path: "/teams",
          responseStatus: 200,
          duration: "3ms",
          headers: "Age: 15",
        },
      },
      {
        title: "Express was never contacted",
        description:
          "The backend didn't receive any request. The response was served entirely from Varnish's cache — much faster and no load on the backend.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          varnishStatus: "HIT",
        },
        log: null,
      },
    ],
  },
  {
    id: "etag-revalidation",
    name: "TTL Expired — ETag Revalidation",
    shortName: "3. ETag",
    steps: [
      {
        title: "60 seconds have passed",
        description:
          "The TTL has expired. Varnish still has the cached response but considers it stale. It needs to check with the backend if the data has changed.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          arrowBrowserToVarnish: true,
          arrowLabel: "GET /teams",
        },
        log: null,
      },
      {
        title: "Varnish sends conditional request",
        description:
          'Varnish forwards the request to Express but includes the If-None-Match header with the cached ETag. This asks: "has the data changed since this version?"',
        diagram: {
          ...inactiveDiagram,
          varnishActive: true,
          expressActive: true,
          arrowVarnishToExpress: true,
          arrowLabel: "GET /teams + If-None-Match: fb089ab...",
        },
        log: null,
      },
      {
        title: "Express: 304 Not Modified",
        description:
          "Express computes the current ETag and compares it. The data hasn't changed — so it returns 304 with no body. Only headers are transmitted, saving bandwidth.",
        diagram: {
          ...inactiveDiagram,
          expressActive: true,
          varnishActive: true,
          arrowExpressToVarnish: true,
          responseLabel: "304 Not Modified (no body)",
        },
        log: null,
      },
      {
        title: "Varnish refreshes TTL",
        description:
          "Varnish receives the 304, refreshes its TTL for another 60 seconds, and serves the cached response to the browser.",
        diagram: {
          ...inactiveDiagram,
          varnishActive: true,
          browserActive: true,
          varnishStatus: "HIT",
          arrowVarnishToBrowser: true,
          responseLabel: "200 + X-Cache: HIT + Age: 0",
        },
        log: {
          status: "HIT",
          method: "GET",
          path: "/teams",
          responseStatus: 200,
          duration: "8ms",
          headers: "Revalidated via 304",
        },
      },
      {
        title: "Efficient update check",
        description:
          "The backend confirmed the data is unchanged without resending the full response body. The cache is refreshed for another TTL period. This is the power of ETags.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          varnishStatus: "HIT",
        },
        log: null,
      },
    ],
  },
  {
    id: "edit-individual",
    name: "Edit an Individual",
    shortName: "4. Edit Individual",
    steps: [
      {
        title: 'Browser sends PUT to update individual',
        description:
          'The user edits Alice\'s name to "Alicia". The browser sends PUT /individuals/ind-1 through Varnish.',
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          arrowBrowserToVarnish: true,
          arrowLabel: 'PUT /individuals/ind-1',
        },
        log: null,
      },
      {
        title: "Varnish passes through — PUT is never cached",
        description:
          "Varnish never caches write requests (PUT, POST, DELETE). It forwards the request directly to Express.",
        diagram: {
          ...inactiveDiagram,
          varnishActive: true,
          expressActive: true,
          varnishStatus: "PASS",
          arrowVarnishToExpress: true,
          arrowLabel: "PUT /individuals/ind-1",
        },
        log: null,
      },
      {
        title: "Express updates data and signals purge",
        description:
          'Express updates the in-memory data and responds with X-Purge: individual-ind-1. This tells Varnish to evict that specific cached entry.',
        diagram: {
          ...inactiveDiagram,
          expressActive: true,
          varnishActive: true,
          arrowExpressToVarnish: true,
          responseLabel: "200 + X-Purge: individual-ind-1",
        },
        log: null,
      },
      {
        title: "Varnish purges the cached individual",
        description:
          'Varnish reads the X-Purge header and uses xkey to find and evict all cached responses tagged with "individual-ind-1". The cache entry is now gone.',
        diagram: {
          ...inactiveDiagram,
          varnishActive: true,
          varnishStatus: "MISS",
          browserActive: true,
          arrowVarnishToBrowser: true,
          responseLabel: "200 (updated data)",
        },
        log: {
          status: "PASS",
          method: "PUT",
          path: "/individuals/ind-1",
          responseStatus: 200,
          duration: "12ms",
          headers: "X-Purge: individual-ind-1",
        },
      },
      {
        title: "TanStack Query updates optimistically",
        description:
          'The frontend uses queryClient.setQueryData to immediately update the local cache with the response. The UI shows "Alicia" without waiting for another GET request.',
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
        },
        log: null,
      },
      {
        title: "Next GET returns fresh data",
        description:
          "When anyone else requests this individual, Varnish has a MISS (it was purged). It fetches fresh data from Express and caches the new version.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          expressActive: true,
          varnishStatus: "MISS",
          arrowBrowserToVarnish: true,
          arrowVarnishToExpress: true,
          arrowLabel: "GET /individuals/ind-1",
        },
        log: {
          status: "MISS",
          method: "GET",
          path: "/individuals/ind-1",
          responseStatus: 200,
          duration: "15ms",
          headers: 'ETag: c7871035... (new)',
        },
      },
    ],
  },
  {
    id: "edit-team",
    name: "Edit Team Members",
    shortName: "5. Edit Team",
    steps: [
      {
        title: "Browser sends PUT to update team members",
        description:
          "The user adds ind-4 to the Engineering team. The browser sends PUT /teams/team-1/members through Varnish.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          arrowBrowserToVarnish: true,
          arrowLabel: "PUT /teams/team-1/members",
        },
        log: null,
      },
      {
        title: "Varnish passes through to Express",
        description:
          "Write requests are never cached. Varnish forwards the PUT to the directory service.",
        diagram: {
          ...inactiveDiagram,
          varnishActive: true,
          expressActive: true,
          varnishStatus: "PASS",
          arrowVarnishToExpress: true,
          arrowLabel: "PUT /teams/team-1/members",
        },
        log: null,
      },
      {
        title: "Express updates and signals purge",
        description:
          'Express updates the team membership and responds with X-Purge: team-team-1. Only this specific team\'s cache is invalidated — the teams list is unaffected.',
        diagram: {
          ...inactiveDiagram,
          expressActive: true,
          varnishActive: true,
          arrowExpressToVarnish: true,
          responseLabel: "200 + X-Purge: team-team-1",
        },
        log: {
          status: "PASS",
          method: "PUT",
          path: "/teams/team-1/members",
          responseStatus: 200,
          duration: "10ms",
          headers: "X-Purge: team-team-1",
        },
      },
      {
        title: "TanStack Query updates local cache",
        description:
          "The frontend updates the team data in TanStack Query's cache using the response. The UI reflects the new member list immediately.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          arrowVarnishToBrowser: true,
          responseLabel: "200 (updated team)",
        },
        log: null,
      },
      {
        title: "Next GET for this team is a MISS",
        description:
          "When anyone fetches team-1, Varnish has a MISS (purged). It gets fresh data from Express with the updated member list.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          varnishActive: true,
          expressActive: true,
          varnishStatus: "MISS",
          arrowBrowserToVarnish: true,
          arrowVarnishToExpress: true,
          arrowLabel: "GET /teams/team-1",
        },
        log: {
          status: "MISS",
          method: "GET",
          path: "/teams/team-1",
          responseStatus: 200,
          duration: "14ms",
          headers: "New memberIds in response",
        },
      },
    ],
  },
  {
    id: "cache-off",
    name: "Cache OFF (Direct to Backend)",
    shortName: "6. Cache OFF",
    steps: [
      {
        title: "User toggles cache OFF",
        description:
          "The frontend switches its base URL from the Varnish ports (8081/8082) to the Express ports (4001/4002). TanStack Query cache is cleared.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
        },
        log: null,
      },
      {
        title: "Browser sends GET directly to Express",
        description:
          "Requests bypass Varnish entirely. The browser talks directly to the Express backend.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          expressActive: true,
          arrowBrowserToExpress: true,
          arrowLabel: "GET /teams (port 4001)",
        },
        log: null,
      },
      {
        title: "Express returns data — no caching",
        description:
          "Express returns the response directly. There is no caching layer — every request hits the backend. Responses still include Cache-Control and ETag headers, but nobody is acting on them.",
        diagram: {
          ...inactiveDiagram,
          expressActive: true,
          browserActive: true,
          arrowExpressToBrowser: true,
          responseLabel: "200 (direct)",
        },
        log: {
          status: "200",
          method: "GET",
          path: "/teams",
          responseStatus: 200,
          duration: "25ms",
          headers: "No X-Cache header",
        },
      },
      {
        title: "Every request hits Express",
        description:
          "Without Varnish, there are no cache HITs. Every page load, every reload sends requests to the backend. This is slower and puts more load on the server — but data is always fresh.",
        diagram: {
          ...inactiveDiagram,
          browserActive: true,
          expressActive: true,
          arrowBrowserToExpress: true,
          arrowExpressToBrowser: true,
          arrowLabel: "Every request",
          responseLabel: "Always fresh, always slow",
        },
        log: null,
      },
    ],
  },
];
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/frontend
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/learn/scenarios.ts
git commit -m "feat: add scenario data for all 6 caching scenarios"
```

---

### Task 3: Architecture Diagram Components

**Files:**
- Create: `frontend/src/learn/Arrow.tsx`
- Create: `frontend/src/learn/Diagram.tsx`

- [ ] **Step 1: Write Arrow component**

Write `frontend/src/learn/Arrow.tsx`:

```tsx
interface ArrowProps {
  active: boolean;
  reverse?: boolean;
  label?: string | null;
}

export function Arrow({ active, reverse = false, label }: ArrowProps) {
  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        height: "40px",
        display: "flex",
        alignItems: "center",
        opacity: active ? 1 : 0.15,
        transition: "opacity 0.3s",
      }}
    >
      {/* Line */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: "3px",
          background: active ? "#4caf50" : "#555",
          borderRadius: "2px",
          transform: "translateY(-50%)",
        }}
      />
      {/* Arrowhead */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          ...(reverse
            ? { left: 0, transform: "translateY(-50%)", borderRight: `10px solid ${active ? "#4caf50" : "#555"}`, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", width: 0, height: 0 }
            : { right: 0, transform: "translateY(-50%)", borderLeft: `10px solid ${active ? "#4caf50" : "#555"}`, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", width: 0, height: 0 }),
        }}
      />
      {/* Animated pulse */}
      {active && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: reverse ? "auto" : 0,
            right: reverse ? 0 : "auto",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#4caf50",
            transform: "translateY(-50%)",
            animation: `pulse-${reverse ? "reverse" : "forward"} 1s ease-in-out infinite`,
            boxShadow: "0 0 8px rgba(76,175,80,0.6)",
          }}
        />
      )}
      {/* Label */}
      {label && (
        <div
          style={{
            position: "absolute",
            top: "-18px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "10px",
            color: active ? "#4caf50" : "#666",
            whiteSpace: "nowrap",
            fontFamily: "monospace",
            transition: "color 0.3s",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write Diagram component**

Write `frontend/src/learn/Diagram.tsx`:

```tsx
import { Arrow } from "./Arrow";
import type { DiagramState } from "./scenarios";

interface BoxProps {
  label: string;
  sublabel: string;
  color: string;
  active: boolean;
  badge?: string | null;
  badgeColor?: string;
}

function Box({ label, sublabel, color, active, badge, badgeColor }: BoxProps) {
  return (
    <div style={{ textAlign: "center", transition: "opacity 0.3s", opacity: active ? 1 : 0.3 }}>
      <div
        style={{
          width: "110px",
          height: "70px",
          border: `2px solid ${color}`,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? `${color}15` : "transparent",
          fontWeight: "bold",
          fontSize: "14px",
          color: "#eee",
          boxShadow: active ? `0 0 12px ${color}40` : "none",
          transition: "all 0.3s",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "10px", color: "#888", marginTop: "4px" }}>{sublabel}</div>
      {badge && (
        <div
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            marginTop: "4px",
            color: badgeColor,
            animation: "badge-pop 0.3s ease-out",
          }}
        >
          {badge}
        </div>
      )}
    </div>
  );
}

interface DiagramProps {
  state: DiagramState;
}

export function Diagram({ state }: DiagramProps) {
  const varnishBadgeColor =
    state.varnishStatus === "HIT"
      ? "#4caf50"
      : state.varnishStatus === "MISS"
        ? "#f44336"
        : state.varnishStatus === "PASS"
          ? "#ff9800"
          : undefined;

  // Determine which arrows to show and their directions
  const showTopRow = !state.arrowBrowserToExpress && !state.arrowExpressToBrowser;
  const showDirectRow = state.arrowBrowserToExpress || state.arrowExpressToBrowser;

  return (
    <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
      {showTopRow && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Box label="Browser" sublabel="TanStack Query" color="#2196f3" active={state.browserActive} />
          <Arrow
            active={state.arrowBrowserToVarnish || state.arrowVarnishToBrowser}
            reverse={state.arrowVarnishToBrowser && !state.arrowBrowserToVarnish}
            label={state.arrowBrowserToVarnish ? state.arrowLabel : state.arrowVarnishToBrowser ? state.responseLabel : null}
          />
          <Box
            label="Varnish"
            sublabel="Reverse Proxy"
            color="#ff9800"
            active={state.varnishActive}
            badge={state.varnishStatus}
            badgeColor={varnishBadgeColor}
          />
          <Arrow
            active={state.arrowVarnishToExpress || state.arrowExpressToVarnish}
            reverse={state.arrowExpressToVarnish && !state.arrowVarnishToExpress}
            label={state.arrowVarnishToExpress ? state.arrowLabel : state.arrowExpressToVarnish ? state.responseLabel : null}
          />
          <Box label="Express" sublabel="In-memory data" color="#9c27b0" active={state.expressActive} />
        </div>
      )}
      {showDirectRow && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Box label="Browser" sublabel="TanStack Query" color="#2196f3" active={state.browserActive} />
          <Arrow
            active={state.arrowBrowserToExpress || state.arrowExpressToBrowser}
            reverse={state.arrowExpressToBrowser && !state.arrowBrowserToExpress}
            label={state.arrowBrowserToExpress ? state.arrowLabel : state.arrowExpressToBrowser ? state.responseLabel : null}
          />
          <Box
            label="Varnish"
            sublabel="Bypassed"
            color="#ff9800"
            active={false}
          />
          <div style={{ flex: 1 }} />
          <Box label="Express" sublabel="In-memory data" color="#9c27b0" active={state.expressActive} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/frontend
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/learn/Arrow.tsx frontend/src/learn/Diagram.tsx
git commit -m "feat: add architecture diagram with animated arrows"
```

---

### Task 4: Scenario Picker, Step Card, Step Controls, Log Panel

**Files:**
- Create: `frontend/src/learn/ScenarioPicker.tsx`
- Create: `frontend/src/learn/StepCard.tsx`
- Create: `frontend/src/learn/StepControls.tsx`
- Create: `frontend/src/learn/LogPanel.tsx`

- [ ] **Step 1: Write ScenarioPicker**

Write `frontend/src/learn/ScenarioPicker.tsx`:

```tsx
import type { Scenario } from "./scenarios";

interface ScenarioPickerProps {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function ScenarioPicker({ scenarios, activeId, onSelect }: ScenarioPickerProps) {
  return (
    <div style={{ display: "flex", gap: "8px", padding: "16px 24px", flexWrap: "wrap" }}>
      {scenarios.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            padding: "6px 14px",
            background: s.id === activeId ? "#4caf50" : "#333",
            color: s.id === activeId ? "#fff" : "#aaa",
            border: "none",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: s.id === activeId ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {s.shortName}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write StepCard**

Write `frontend/src/learn/StepCard.tsx`:

```tsx
interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
}

export function StepCard({ stepNumber, title, description }: StepCardProps) {
  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      <div
        key={`${stepNumber}-${title}`}
        style={{
          background: "#16213e",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "16px",
          animation: "fade-in 0.2s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "#4caf50",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "13px",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {stepNumber}
          </div>
          <span style={{ fontWeight: "bold", fontSize: "14px", color: "#eee" }}>{title}</span>
        </div>
        <p style={{ color: "#aaa", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>{description}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write StepControls**

Write `frontend/src/learn/StepControls.tsx`:

```tsx
interface StepControlsProps {
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function StepControls({ current, total, onPrevious, onNext }: StepControlsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        padding: "16px 24px",
        alignItems: "center",
      }}
    >
      <button
        onClick={onPrevious}
        disabled={current === 0}
        style={{
          padding: "8px 20px",
          background: current === 0 ? "#222" : "#333",
          color: current === 0 ? "#555" : "#eee",
          border: "none",
          borderRadius: "6px",
          fontSize: "13px",
          cursor: current === 0 ? "default" : "pointer",
        }}
      >
        Previous
      </button>
      <span style={{ padding: "8px 12px", color: "#aaa", fontSize: "12px" }}>
        Step {current + 1} / {total}
      </span>
      <button
        onClick={onNext}
        disabled={current === total - 1}
        style={{
          padding: "8px 20px",
          background: current === total - 1 ? "#222" : "#4caf50",
          color: current === total - 1 ? "#555" : "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: "bold",
          cursor: current === total - 1 ? "default" : "pointer",
        }}
      >
        Next
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Write LogPanel**

Write `frontend/src/learn/LogPanel.tsx`:

```tsx
import type { LogEntry } from "./scenarios";

interface LogPanelProps {
  entries: LogEntry[];
}

export function LogPanel({ entries }: LogPanelProps) {
  const statusColor = (status: string) => {
    if (status === "HIT") return "#4caf50";
    if (status === "MISS") return "#f44336";
    if (status === "PASS") return "#ff9800";
    return "#aaa";
  };

  return (
    <div
      style={{
        padding: "12px 24px",
        background: "#111",
        borderTop: "1px solid #333",
        fontFamily: "monospace",
        fontSize: "11px",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      <div style={{ color: "#888", marginBottom: "4px", fontWeight: "bold" }}>Request Log</div>
      {entries.length === 0 && <div style={{ color: "#555" }}>Step through the scenario to see requests...</div>}
      {entries.map((entry, i) => (
        <div
          key={i}
          style={{
            padding: "2px 0",
            animation: "slide-in 0.3s ease-out",
          }}
        >
          <span style={{ color: statusColor(entry.status), fontWeight: "bold" }}>{entry.status}</span>
          {" "}
          <span style={{ color: "#eee" }}>{entry.method} {entry.path}</span>
          {" → "}
          <span style={{ color: "#aaa" }}>{entry.responseStatus} ({entry.duration})</span>
          {" — "}
          <span style={{ color: "#666" }}>{entry.headers}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Verify it compiles**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/frontend
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/learn/ScenarioPicker.tsx frontend/src/learn/StepCard.tsx \
       frontend/src/learn/StepControls.tsx frontend/src/learn/LogPanel.tsx
git commit -m "feat: add scenario picker, step card, controls, and log panel"
```

---

### Task 5: Learn Page Shell & CSS Animations

**Files:**
- Create: `frontend/src/pages/LearnPage.tsx`
- Create: `frontend/src/learn/animations.css`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Write CSS animations**

Write `frontend/src/learn/animations.css`:

```css
@keyframes pulse-forward {
  0% { left: 0; opacity: 1; }
  100% { left: calc(100% - 12px); opacity: 0.3; }
}

@keyframes pulse-reverse {
  0% { right: 0; opacity: 1; }
  100% { right: calc(100% - 12px); opacity: 0.3; }
}

@keyframes badge-pop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fade-in {
  0% { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in {
  0% { opacity: 0; transform: translateX(20px); }
  100% { opacity: 1; transform: translateX(0); }
}
```

- [ ] **Step 2: Write LearnPage**

Write `frontend/src/pages/LearnPage.tsx`:

```tsx
import { useState, useMemo } from "react";
import { scenarios } from "../learn/scenarios";
import { ScenarioPicker } from "../learn/ScenarioPicker";
import { Diagram } from "../learn/Diagram";
import { StepCard } from "../learn/StepCard";
import { StepControls } from "../learn/StepControls";
import { LogPanel } from "../learn/LogPanel";
import type { LogEntry } from "../learn/scenarios";
import "../learn/animations.css";

export function LearnPage() {
  const [activeScenarioId, setActiveScenarioId] = useState(scenarios[0].id);
  const [stepIndex, setStepIndex] = useState(0);

  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const step = scenario.steps[stepIndex];

  const logEntries = useMemo(() => {
    const entries: LogEntry[] = [];
    for (let i = 0; i <= stepIndex; i++) {
      const log = scenario.steps[i].log;
      if (log) entries.push(log);
    }
    return entries;
  }, [scenario, stepIndex]);

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    setStepIndex(0);
  };

  return (
    <div style={{ background: "#1a1a2e", color: "#eee", minHeight: "calc(100vh - 45px)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "24px" }}>
        <h1 style={{ padding: "24px 24px 0", margin: 0, fontSize: "22px" }}>
          How HTTP Caching Works
        </h1>
        <p style={{ padding: "4px 24px 0", margin: 0, color: "#aaa", fontSize: "14px" }}>
          Step through each scenario to see how requests flow through the system.
        </p>

        <ScenarioPicker
          scenarios={scenarios}
          activeId={activeScenarioId}
          onSelect={handleSelectScenario}
        />

        <Diagram state={step.diagram} />

        <StepCard
          stepNumber={stepIndex + 1}
          title={step.title}
          description={step.description}
        />

        <StepControls
          current={stepIndex}
          total={scenario.steps.length}
          onPrevious={() => setStepIndex((i) => Math.max(0, i - 1))}
          onNext={() => setStepIndex((i) => Math.min(scenario.steps.length - 1, i + 1))}
        />

        <LogPanel entries={logEntries} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update App.tsx to use LearnPage**

Replace the `LearnPagePlaceholder` in `frontend/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { AppPage } from "./pages/AppPage";
import { LearnPage } from "./pages/LearnPage";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<AppPage />} />
        <Route path="/learn" element={<LearnPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 4: Verify it compiles**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments/frontend
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LearnPage.tsx frontend/src/learn/animations.css frontend/src/App.tsx
git commit -m "feat: wire up LearnPage with all components and animations"
```

---

### Task 6: Docker Rebuild & Smoke Test

- [ ] **Step 1: Rebuild and restart frontend**

```bash
cd /Users/charles.desneuf/Workspace/perso/cache-experiments
docker compose up --build -d --no-deps frontend
```

- [ ] **Step 2: Verify the app page works**

Open `http://localhost:3000/` — should show the Company Directory app with nav bar.

- [ ] **Step 3: Verify the learn page works**

Open `http://localhost:3000/learn` — should show:
- Scenario pills (6 scenarios)
- Architecture diagram with 3 boxes
- Step card with title and description
- Previous/Next controls
- Log panel

Click through all steps of scenario 1. Verify:
- Arrows animate between active components
- Inactive components dim
- Varnish shows MISS badge
- Log entries accumulate
- Step counter updates

Switch to scenario 2. Verify:
- Step resets to 1
- Log panel clears
- Varnish shows HIT badge on step 2

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments from learn page smoke testing"
```

(Skip if no fixes needed.)
