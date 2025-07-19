import { Router, Route, Switch } from 'wouter';
import { SupabaseAuthProvider } from './hooks/use-supabase-auth';
import { Toaster } from './components/ui/toaster';

// Pages
import Home from './pages/home';
import Tools from './pages/tools';
import Login from './pages/login';
import Signup from './pages/signup';
import AuthDemo from './pages/auth-demo';
import NotFound from './pages/not-found';
import { AuthGuard } from './components/auth-guard';

function App() {
  return (
    <SupabaseAuthProvider>
      <Router>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/dashboard">
            <AuthGuard>
              <Tools />
            </AuthGuard>
          </Route>
          <Route path="/tools">
            <AuthGuard>
              <Tools />
            </AuthGuard>
          </Route>
          <Route path="/auth-demo" component={AuthDemo} />
          <Route component={NotFound} />
        </Switch>
      </Router>
      <Toaster />
    </SupabaseAuthProvider>
  );
}

export default App;