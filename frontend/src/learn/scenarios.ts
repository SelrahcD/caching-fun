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
