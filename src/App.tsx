import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import Landing from "./pages/Landing";
import AdminSignIn from "./pages/admin/SignIn";
import AdminDashboard from "./pages/admin/Dashboard";
import StudentSignIn from "./pages/student/SignIn";
import StudentSignUp from "./pages/student/SignUp";
import SetNewPassword from "./pages/student/SetNewPassword";
import StudentDashboard from "./pages/student/Dashboard";
import StudentChat from "./pages/student/Chat";
import AgentChat from "./pages/student/AgentChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <UserProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/admin/signin" element={<AdminSignIn />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/student/signin" element={<StudentSignIn />} />
              <Route path="/student/signup" element={<StudentSignUp />} />
              <Route path="/student/set-new-password" element={<SetNewPassword />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/chat/:modelId" element={<StudentChat />} />
              <Route path="/student/agent-chat/:agentId" element={<AgentChat />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </UserProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
