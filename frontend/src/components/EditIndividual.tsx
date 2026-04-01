import { useState } from "react";
import { useUpdateIndividual } from "../hooks/useIndividuals";
import { Individual } from "../api/client";

interface EditIndividualProps {
  individual: Individual;
  onClose: () => void;
}

export function EditIndividual({ individual, onClose }: EditIndividualProps) {
  const [firstName, setFirstName] = useState(individual.firstName);
  const [lastName, setLastName] = useState(individual.lastName);
  const mutation = useUpdateIndividual(individual.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ firstName, lastName }, { onSuccess: onClose });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "8px",
          minWidth: "300px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Edit {individual.firstName} {individual.lastName}</h3>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            First Name
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            Last Name
          </label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", background: "white" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            style={{ padding: "8px 16px", background: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
