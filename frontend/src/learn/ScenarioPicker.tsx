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
