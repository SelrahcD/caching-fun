import { useState } from "react";
import { useTeam, useUpdateTeamMembers } from "../hooks/useTeams";

const ALL_INDIVIDUAL_IDS = [
  "ind-1", "ind-2", "ind-3", "ind-4",
  "ind-5", "ind-6", "ind-7", "ind-8",
];

interface EditTeamMembersProps {
  teamId: string;
  onClose: () => void;
}

export function EditTeamMembers({ teamId, onClose }: EditTeamMembersProps) {
  const { data: team } = useTeam(teamId);
  const [memberIds, setMemberIds] = useState<string[]>(team?.memberIds ?? []);
  const mutation = useUpdateTeamMembers(teamId);

  const toggleMember = (id: string) => {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(memberIds, { onSuccess: onClose });
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
        <h3 style={{ marginTop: 0 }}>Edit Members: {team?.name}</h3>
        <div style={{ marginBottom: "16px" }}>
          {ALL_INDIVIDUAL_IDS.map((id) => (
            <label
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 0",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={memberIds.includes(id)}
                onChange={() => toggleMember(id)}
              />
              {id}
            </label>
          ))}
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
