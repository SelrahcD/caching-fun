import { useState } from "react";
import { TeamList } from "../components/TeamList";
import { EditIndividual } from "../components/EditIndividual";
import { EditTeamMembers } from "../components/EditTeamMembers";
import { CacheToggle } from "../components/CacheToggle";
import type { Individual } from "../api/client";

export function AppPage() {
  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <h1 style={{ margin: 0, flex: 1 }}>Company Directory</h1>
        <CacheToggle />
      </div>

      <TeamList
        onEditIndividual={setEditingIndividual}
        onEditTeam={setEditingTeamId}
      />

      {editingIndividual && (
        <EditIndividual
          individual={editingIndividual}
          onClose={() => setEditingIndividual(null)}
        />
      )}

      {editingTeamId && (
        <EditTeamMembers
          teamId={editingTeamId}
          onClose={() => setEditingTeamId(null)}
        />
      )}
    </div>
  );
}
