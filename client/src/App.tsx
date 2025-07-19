import { Router, Route, Switch } from 'wouter';
import { SupabaseAuthProvider } from './hooks/use-supabase-auth';
import { Toaster } from './components/ui/toaster';

// Pages
import Home from './pages/home';
import Tools from './pages/tools';
import AuthDemo from './pages/auth-demo';
import NotFound from './pages/not-found';

function App() {
  return (
    <SupabaseAuthProvider>
      <Router>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Tools} />
          <Route path="/tools" component={Tools} />
          <Route path="/auth-demo" component={AuthDemo} />
          <Route component={NotFound} />
        </Switch>
      </Router>
      <Toaster />
    </SupabaseAuthProvider>
  );
}

export default App;