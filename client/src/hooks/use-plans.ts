import { useQuery } from "@tanstack/react-query";
import type { Plan } from "@shared/schema";

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}