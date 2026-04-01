import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIndividual,
  updateIndividual,
  Individual,
} from "../api/client";

export function useIndividual(id: string) {
  return useQuery({
    queryKey: ["individual", id],
    queryFn: () => fetchIndividual(id),
  });
}

export function useUpdateIndividual(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Omit<Individual, "id">>) =>
      updateIndividual(id, data),
    onSuccess: (updatedIndividual) => {
      queryClient.setQueryData(["individual", id], updatedIndividual);
      queryClient.invalidateQueries({ queryKey: ["individual", id] });
    },
  });
}
