import type { Individual } from "../api/client";

interface IndividualCardProps {
  individual: Individual;
  onEdit: (individual: Individual) => void;
}

export function IndividualCard({ individual, onEdit }: IndividualCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 12px",
        background: "#f5f5f5",
        borderRadius: "6px",
        marginBottom: "4px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: "bold",
          color: "#666",
        }}
      >
        {individual.firstName[0]}
        {individual.lastName[0]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>
          {individual.firstName} {individual.lastName}
        </div>
        <div style={{ fontSize: "12px", color: "#888" }}>{individual.id}</div>
      </div>
      <button
        onClick={() => onEdit(individual)}
        style={{
          padding: "4px 12px",
          background: "#2196f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        Edit
      </button>
    </div>
  );
}
