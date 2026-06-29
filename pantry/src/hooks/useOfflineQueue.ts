import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOnlineStatus } from "./useOnlineStatus";

/**
 * When the browser comes back online, refetches all stale queries
 * so the UI catches up with any changes that happened while offline.
 *
 * A full offline mutation queue (storing writes in IndexedDB and
 * replaying them) is a larger feature; for now this hook simply
 * ensures read-side freshness on reconnect.
 */
export function useOfflineQueue() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOnline) {
      // Refetch all active queries when we come back online
      queryClient.refetchQueries({ type: "active" });
    }
  }, [isOnline, queryClient]);
}
