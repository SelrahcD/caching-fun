import { useTeamList } from "../hooks/useTeams";
import { TeamCard } from "./TeamCard";
import { Individual } from "../api/client";

interface TeamListProps {
  onEditIndividual: (individual: Individual) => void;
  onEditTeam: (teamId: string) => void;
}

export function TeamList({ onEditIndividual, onEditTeam }: TeamListProps) {
  const { data: teams, isLoading, error } = useTeamList();

  if (isLoading) return <div>Loading teams...</div>;
  if (error) return <div style={{ color: "red" }}>Error loading teams</div>;
  if (!teams) return null;

  return (
    <div>
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          teamId={team.id}
          teamName={team.name}
          onEditIndividual={onEditIndividual}
          onEditTeam={onEditTeam}
        />
      ))}
    </div>
  );
}
