import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LandingPage from "@/pages/landing";
import OAuthCallback from "@/pages/oauth-callback";

import ImageOptimizerPage from "@/pages/image-optimizer";
import PricingPage from "@/pages/pricing";
import PlansPage from "@/pages/plans";
import LoginPage from "@/pages/login";
import CheckoutSuccessPage from "@/pages/checkout-success";
import CheckoutCancelPage from "@/pages/checkout-cancel";
import ProfilePage from "@/pages/profile";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import Layout from "@/components/layout";
import RequireAuth from "@/components/require-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/seo" component={Home} />
      <Route path="/oauth-callback" component={OAuthCallback} />
      
      <Route path="/image-optimizer" component={ImageOptimizerPage} />
      <Route path="/plans" component={PlansPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/checkout-success" component={CheckoutSuccessPage} />
      <Route path="/checkout-cancel" component={CheckoutCancelPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Layout>
            <RequireAuth>
              <Router />
            </RequireAuth>
          </Layout>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
