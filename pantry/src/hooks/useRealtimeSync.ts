import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Connects to the server-sent event stream at `/api/events` and
 * automatically invalidates React Query caches when items are
 * created, updated, or deleted on other clients.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/events");

      es.addEventListener("item:created", () => {
        queryClient.invalidateQueries();
      });

      es.addEventListener("item:updated", () => {
        queryClient.invalidateQueries();
      });

      es.addEventListener("item:deleted", () => {
        queryClient.invalidateQueries();
      });

      es.onerror = () => {
        es?.close();
        // Reconnect after a short delay
        retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      es?.close();
    };
  }, [queryClient]);
}
