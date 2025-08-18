import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import LeadManagement from "@/pages/lead-management";
import AIForecasting from "@/pages/ai-forecasting";
import AIMarketing from "@/pages/ai-marketing";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import BookDemo from "@/pages/book-demo";
import Pricing from "@/pages/pricing";
import Students from "@/pages/students";
import EMandate from "@/pages/e-mandate";
import StudentFees from "@/pages/student-fees";
import StaffAI from "@/pages/staff-ai";
import Sidebar from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";
import Expenses from "@/pages/expenses";
import Communication from "@/pages/communication";
import AddLeadPage from "@/pages/leads-add";
import HealthDashboard from "@/pages/health-dashboard";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={Login} />
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
