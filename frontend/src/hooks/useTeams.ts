import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTeams, fetchTeam, updateTeamMembers } from "../api/client";

export function useTeamList() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ["team", id],
    queryFn: () => fetchTeam(id),
  });
}

export function useUpdateTeamMembers(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberIds: string[]) => updateTeamMembers(teamId, memberIds),
    onSuccess: (updatedTeam) => {
      queryClient.setQueryData(["team", teamId], updatedTeam);
    },
  });
}
