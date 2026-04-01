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
