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
