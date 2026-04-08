import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import MarketsPage from "@/pages/markets";
import ResultsPage from "@/pages/results";
import DepositsPage from "@/pages/deposits";
import WithdrawalsPage from "@/pages/withdrawals";
import UpiPage from "@/pages/upi";
import AnalyticsPage from "@/pages/analytics";
import SubAdminsPage from "@/pages/sub-admins";
import MyAccountPage from "@/pages/my-account";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoggingIn } = useAuth();
  
  if (!isAuthenticated && !isLoggingIn) {
    window.location.href = `${import.meta.env.BASE_URL}login`;
    return null;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => {
        window.location.href = `${import.meta.env.BASE_URL}dashboard`;
        return null;
      }} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/users"><ProtectedRoute component={UsersPage} /></Route>
      <Route path="/markets"><ProtectedRoute component={MarketsPage} /></Route>
      <Route path="/results"><ProtectedRoute component={ResultsPage} /></Route>
      <Route path="/deposits"><ProtectedRoute component={DepositsPage} /></Route>
      <Route path="/withdrawals"><ProtectedRoute component={WithdrawalsPage} /></Route>
      <Route path="/upi"><ProtectedRoute component={UpiPage} /></Route>
      <Route path="/analytics"><ProtectedRoute component={AnalyticsPage} /></Route>
      <Route path="/sub-admins"><ProtectedRoute component={SubAdminsPage} /></Route>
      <Route path="/my-account"><ProtectedRoute component={MyAccountPage} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
