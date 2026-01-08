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
import Sidebar from "@/components/layout/sidebar";
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
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Dashboard />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/leads">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <LeadManagement />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/leads/add">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <AddLeadPage />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/ai-forecasting">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <AIForecasting />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/ai-marketing">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <AIMarketing />
              </div>
            </div>
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
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <ComprehensiveAIDashboard />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/reports">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Reports />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Settings />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/expenses">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Expenses />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/accounts">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Accounts />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/students">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Students />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/e-mandate">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <EMandate />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/student-fees">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <StudentFees />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/daycare">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Daycare />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/staff-ai">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <StaffAI />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/communication">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Communication />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/inventory">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Inventory />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/meta-marketing">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <MetaMarketing />
              </div>
            </div>
          )} />
        )}
      </Route>
      <Route path="/app-management">
        {() => (
          <ProtectedRoute component={() => (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
              <Sidebar />
              <div className="flex-1 ml-64">
                <AppManagement />
              </div>
            </div>
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
            <TooltipProvider>
              <FollowUpMonitor />
              <Toaster />
              <Router />
              <EnvironmentInfo />
            </TooltipProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
