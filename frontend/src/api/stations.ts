import { useQuery } from "@tanstack/react-query";
import { http } from "@/api/client";

export function useStations() {
  return useQuery({
    queryKey: ["stations"],
    queryFn: () => http.get<string[]>("/trains/stations"),
  });
}
