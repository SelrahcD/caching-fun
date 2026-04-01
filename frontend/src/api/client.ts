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
  cacheSource: "Browser Cache" | "Varnish HIT" | "Varnish MISS" | "Direct";
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

function waitForPerfEntry(url: string): Promise<PerformanceResourceTiming> {
  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === url) {
          observer.disconnect();
          resolve(entry as PerformanceResourceTiming);
          return;
        }
      }
    });
    observer.observe({ type: "resource", buffered: true });
  });
}

async function trackedFetch(url: string, options?: RequestInit): Promise<Response> {
  const perfPromise = waitForPerfEntry(url);
  const start = performance.now();
  const response = await fetch(url, options);
  const duration = Math.round(performance.now() - start);
  const perfEntry = await perfPromise;

  const xCache = response.headers.get("X-Cache");
  let cacheSource: RequestLog["cacheSource"];
  if (perfEntry.transferSize === 0) {
    cacheSource = "Browser Cache";
  } else if (xCache === "HIT") {
    cacheSource = "Varnish HIT";
  } else if (xCache === "MISS") {
    cacheSource = "Varnish MISS";
  } else {
    cacheSource = "Direct";
  }

  const log: RequestLog = {
    url,
    method: options?.method ?? "GET",
    status: response.status,
    duration,
    cacheSource,
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
