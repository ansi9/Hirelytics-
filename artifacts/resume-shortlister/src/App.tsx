import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { Dashboard } from "@/pages/dashboard";
import { Jobs } from "@/pages/jobs";
import { JobDetail } from "@/pages/jobs/[id]";
import { Candidates } from "@/pages/candidates";
import { CandidateDetail } from "@/pages/candidates/[id]";
import { Analyze } from "@/pages/analyze";
import { Shortlisted } from "@/pages/shortlisted";
import { Analytics } from "@/pages/analytics";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/jobs/:id" component={JobDetail} />
        <Route path="/candidates" component={Candidates} />
        <Route path="/candidates/:id" component={CandidateDetail} />
        <Route path="/analyze" component={Analyze} />
        <Route path="/shortlisted" component={Shortlisted} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
