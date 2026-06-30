import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Items from "@/pages/items";
import NewItem from "@/pages/new-item";
import ItemDetail from "@/pages/item-detail";
import Shopping from "@/pages/shopping";
import PrivacyPolicy from "@/pages/privacy";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/items/new" component={NewItem} />
      <Route path="/items/:id" component={ItemDetail} />
      <Route path="/items" component={Items} />
      <Route path="/shopping" component={Shopping} />
      <Route component={NotFound} />
    </Switch>
  );
}

/** Mounts background sync hooks once, inside the QueryClientProvider. */
function AppServices() {
  useRealtimeSync();
  useOfflineQueue();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppServices />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              border: "1px solid hsl(var(--card-border))",
              borderRadius: "0.75rem",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
