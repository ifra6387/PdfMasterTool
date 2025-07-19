import { Router, Route, Switch } from 'wouter';
import { Toaster } from './components/ui/toaster';

// Pages
import Home from './pages/home';
import Tools from './pages/tools';
import NotFound from './pages/not-found';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tools" component={Tools} />
        <Route path="/dashboard" component={Tools} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </Router>
  );
}

export default App;