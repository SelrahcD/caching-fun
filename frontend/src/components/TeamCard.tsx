import { useTeam } from "../hooks/useTeams";
import { useIndividual } from "../hooks/useIndividuals";
import { IndividualCard } from "./IndividualCard";
import { Individual } from "../api/client";

interface TeamCardProps {
  teamId: string;
  teamName: string;
  onEditIndividual: (individual: Individual) => void;
  onEditTeam: (teamId: string) => void;
}

function IndividualLoader({
  id,
  onEdit,
}: {
  id: string;
  onEdit: (individual: Individual) => void;
}) {
  const { data, isLoading, error } = useIndividual(id);

  if (isLoading) return <div style={{ padding: "8px", color: "#888" }}>Loading {id}...</div>;
  if (error) return <div style={{ padding: "8px", color: "red" }}>Error loading {id}</div>;
  if (!data) return null;

  return <IndividualCard individual={data} onEdit={onEdit} />;
}

export function TeamCard({ teamId, teamName, onEditIndividual, onEditTeam }: TeamCardProps) {
  const { data: team, isLoading, error } = useTeam(teamId);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
        background: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
        <h2 style={{ margin: 0, flex: 1 }}>{teamName}</h2>
        <button
          onClick={() => onEditTeam(teamId)}
          style={{
            padding: "4px 12px",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Edit Members
        </button>
      </div>

      {isLoading && <div>Loading team details...</div>}
      {error && <div style={{ color: "red" }}>Error loading team</div>}
      {team && (
        <div>
          {team.memberIds.map((id) => (
            <IndividualLoader key={id} id={id} onEdit={onEditIndividual} />
          ))}
        </div>
      )}
    </div>
  );
}
