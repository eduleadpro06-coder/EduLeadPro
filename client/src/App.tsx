import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import EnvironmentInfo from "@/components/debug/EnvironmentInfo";
import Dashboard from "@/pages/dashboard";
import LeadManagement from "@/pages/lead-management";
import AIForecasting from "@/pages/ai-forecasting";
import AIMarketing from "@/pages/ai-marketing";
import AIEnhancedDashboard from "@/pages/ai-enhanced-dashboard";
import ComprehensiveAIDashboard from "@/pages/comprehensive-ai-dashboard";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import MetaMarketing from "@/pages/meta-marketing";
import AppManagement from "@/pages/app-management";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import BookDemo from "@/pages/book-demo";
import AuthCallback from "@/pages/auth/callback";
import Pricing from "@/pages/pricing";
import Students from "@/pages/students";
import EMandate from "@/pages/e-mandate";
import StudentFees from "@/pages/student-fees";
import StaffAI from "@/pages/staff-ai";
import Daycare from "@/pages/daycare";
import Shell from "@/components/layout/Shell";
import { SidebarProvider } from "@/contexts/SidebarContext";
import NotFound from "@/pages/not-found";
import Expenses from "@/pages/expenses";
import Accounts from "@/pages/accounts";
import Communication from "@/pages/communication";
import Inventory from "@/pages/inventory";
import AddLeadPage from "@/pages/leads-add";
import HealthDashboard from "@/pages/health-dashboard";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import FollowUpMonitor from "@/components/notifications/follow-up-monitor";
import LeadMonitor from "@/components/notifications/lead-monitor";

function Router() {
  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/book-demo" component={BookDemo} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <Dashboard />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/leads">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <LeadManagement />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/leads/add">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <AddLeadPage />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/ai-forecasting">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <AIForecasting />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/ai-marketing">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <AIMarketing />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/ai-enhanced">
        {() => (
          <ProtectedRoute component={AIEnhancedDashboard} />
        )}
      </Route>
      <Route path="/ai-comprehensive">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <ComprehensiveAIDashboard />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/reports">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <Reports />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <Settings />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/expenses">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <Expenses />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/accounts">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <Accounts />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/students">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <Students />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/e-mandate">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <EMandate />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/student-fees">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <StudentFees />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/daycare">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <Daycare />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/staff-ai">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <StaffAI />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/communication">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <Communication />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/inventory">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <Inventory />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/meta-marketing">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <MetaMarketing />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/app-management">
        {() => (
          <ProtectedRoute component={() => (
            <Shell>
              <AppManagement />
            </Shell>
          )} />
        )}
      </Route>
      <Route path="/analytics">
        {() => {
          window.location.replace("/dashboard");
          return null;
        }}
      </Route>
      <Route path="/health-dashboard">
        {() => (
          <HealthDashboard />
        )}
      </Route>
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Add error boundary to catch and display runtime errors
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Add global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || 'An unknown error occurred');
      // Prevent the default error handling
      event.preventDefault();
    };

    // Add unhandled promise rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setErrorMessage(event.reason?.message || 'An unhandled promise rejection occurred');
      // Prevent the default error handling
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-700 mb-4">{errorMessage || 'An unexpected error occurred. Please try refreshing the page.'}</p>
          <div className="bg-gray-100 p-4 rounded mb-4 overflow-auto max-h-40">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
              Error details: {errorMessage}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <SidebarProvider>
              <TooltipProvider>
                <FollowUpMonitor />
                <LeadMonitor />
                <Toaster />
                <Router />
                <EnvironmentInfo />
              </TooltipProvider>
            </SidebarProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
