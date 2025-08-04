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

function Router() {
  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/book-demo" component={BookDemo} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <Dashboard />
            </div>
          </div>
        )}
      </Route>
      <Route path="/leads">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <LeadManagement />
            </div>
          </div>
        )}
      </Route>
      <Route path="/leads/add">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <AddLeadPage />
            </div>
          </div>
        )}
      </Route>
      <Route path="/ai-forecasting">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <AIForecasting />
            </div>
          </div>
        )}
      </Route>
      <Route path="/ai-marketing">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <AIMarketing />
            </div>
          </div>
        )}
      </Route>
      <Route path="/reports">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <Reports />
            </div>
          </div>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <Settings />
            </div>
          </div>
        )}
      </Route>
      <Route path="/expenses">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <Expenses />
            </div>
          </div>
        )}
      </Route>
      <Route path="/students">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <Students />
            </div>
          </div>
        )}
      </Route>
      <Route path="/e-mandate">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <EMandate />
            </div>
          </div>
        )}
      </Route>
      <Route path="/student-fees">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <StudentFees />
            </div>
          </div>
        )}
      </Route>
      <Route path="/staff-ai">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <StaffAI />
            </div>
          </div>
        )}
      </Route>
      <Route path="/communication">
        {() => (
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <Communication />
            </div>
          </div>
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
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
