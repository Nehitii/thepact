import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import TheCall from "./pages/TheCall";
import Goals from "./pages/Goals";
import NewGoal from "./pages/NewGoal";
import GoalDetail from "./pages/GoalDetail";
import StepDetail from "./pages/StepDetail";
import Finance from "./pages/Finance";
import Journal from "./pages/Journal";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import Shop from "./pages/Shop";
import Community from "./pages/Community";
import Legal from "./pages/Legal";
import Admin from "./pages/Admin";
import AdminCosmeticsManager from "./pages/AdminCosmeticsManager";
import AdminModuleManager from "./pages/AdminModuleManager";
import AdminMoneyManager from "./pages/AdminMoneyManager";
import AdminMode from "./pages/AdminMode";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/the-call"
                element={
                  <ProtectedRoute>
                    <TheCall />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals/new"
                element={
                  <ProtectedRoute>
                    <NewGoal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals/:id"
                element={
                  <ProtectedRoute>
                    <GoalDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/step/:stepId"
                element={
                  <ProtectedRoute>
                    <StepDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance"
                element={
                  <ProtectedRoute>
                    <Finance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/journal"
                element={
                  <ProtectedRoute>
                    <Journal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedRoute>
                    <Achievements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop"
                element={
                  <ProtectedRoute>
                    <Shop />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <Community />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/legal"
                element={
                  <ProtectedRoute>
                    <Legal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cosmetics"
                element={
                  <ProtectedRoute>
                    <AdminCosmeticsManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/modules"
                element={
                  <ProtectedRoute>
                    <AdminModuleManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/money"
                element={
                  <ProtectedRoute>
                    <AdminMoneyManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/mode"
                element={
                  <ProtectedRoute>
                    <AdminMode />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
