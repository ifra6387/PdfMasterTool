import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./hooks/use-auth";
import { SupabaseAuthProvider } from "./hooks/use-supabase-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";

import Tool from "@/pages/tool";
import Processing from "@/pages/processing";
import Download from "@/pages/download";

import Dashboard from "@/pages/dashboard";
import { AuthGuard } from "@/components/auth-guard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      <Route path="/tool/:toolName" component={() => (
        <AuthGuard requireAuth={true}>
          <Tool />
        </AuthGuard>
      )} />
      <Route path="/processing/:fileId" component={Processing} />
      <Route path="/download/:token" component={Download} />

      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SupabaseAuthProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
