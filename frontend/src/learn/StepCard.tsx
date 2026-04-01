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
