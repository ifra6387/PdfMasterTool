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
import Tools from "@/pages/tools";
import Processing from "@/pages/processing";
import Download from "@/pages/download";
import LoginStandalone from "@/pages/login-standalone";
import SignUpStandalone from "@/pages/signup-standalone";
import Dashboard from "@/pages/dashboard";
import ToolPlaceholder from "@/pages/tool-placeholder";
import { AuthGuard } from "@/components/auth-guard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      
      <Route path="/tools" component={() => (
        <AuthGuard requireAuth={true}>
          <Tools />
        </AuthGuard>
      )} />

      <Route path="/processing/:fileId" component={Processing} />
      <Route path="/download/:token" component={Download} />
      
      <Route path="/signin" component={LoginStandalone} />
      <Route path="/login" component={LoginStandalone} />
      <Route path="/signup" component={SignUpStandalone} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Tool placeholder routes */}
      <Route path="/tool/:toolName" component={ToolPlaceholder} />
      <Route path="/tools/:toolName" component={ToolPlaceholder} />
      
      {/* Catch all other routes */}
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
