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
