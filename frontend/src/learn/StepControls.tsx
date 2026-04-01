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
