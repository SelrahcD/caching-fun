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
