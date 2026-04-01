import { useEffect, useState } from "react";
import { onRequestLog } from "../api/client";
import type { RequestLog } from "../api/client";

export function DebugPanel() {
  const [logs, setLogs] = useState<RequestLog[]>([]);

  useEffect(() => {
    const unsubscribe = onRequestLog((log) => {
      setLogs((prev) => [log, ...prev].slice(0, 50));
    });
    return unsubscribe;
  }, []);

  const totalRequests = logs.length;
  const browserHits = logs.filter((l) => l.cacheSource === "Browser Cache").length;
  const varnishHits = logs.filter((l) => l.cacheSource === "Varnish HIT").length;
  const misses = logs.filter((l) => l.cacheSource === "Varnish MISS" || l.cacheSource === "Direct").length;

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
        <span style={{ color: "#2196f3" }}>Browser: {browserHits}</span>
        <span style={{ color: "#4caf50" }}>Varnish HIT: {varnishHits}</span>
        <span style={{ color: "#f44336" }}>MISS: {misses}</span>
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
                  color: log.cacheSource === "Browser Cache" ? "#2196f3" : log.cacheSource === "Varnish HIT" ? "#4caf50" : log.cacheSource === "Varnish MISS" ? "#f44336" : "#888",
                  fontWeight: "bold",
                }}
              >
                {log.cacheSource}
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
