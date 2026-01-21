import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
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
import BoundedProfile from "./pages/profile/BoundedProfile";
import PactSettings from "./pages/profile/PactSettings";
import DisplaySound from "./pages/profile/DisplaySound";
import PrivacyControl from "./pages/profile/PrivacyControl";
import NotificationSettings from "./pages/profile/NotificationSettings";
import DataPortability from "./pages/profile/DataPortability";
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
import TodoList from "./pages/TodoList";
import AdminNotifications from "./pages/AdminNotifications";
import Inbox from "./pages/Inbox";
import AdminPromoManager from "./pages/AdminPromoManager";
import Health from "./pages/Health";
import Wishlist from "./pages/Wishlist";
const queryClient = new QueryClient();

// Wrapper component that applies AppLayout to protected routes
function ProtectedWithLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

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
                  <ProtectedWithLayout>
                    <Home />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/the-call"
                element={
                  <ProtectedWithLayout>
                    <TheCall />
                  </ProtectedWithLayout>
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
                  <ProtectedWithLayout>
                    <Goals />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/goals/new"
                element={
                  <ProtectedWithLayout>
                    <NewGoal />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/goals/:id"
                element={
                  <ProtectedWithLayout>
                    <GoalDetail />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/step/:stepId"
                element={
                  <ProtectedWithLayout>
                    <StepDetail />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/finance"
                element={
                  <ProtectedWithLayout>
                    <Finance />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/journal"
                element={
                  <ProtectedWithLayout>
                    <Journal />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedWithLayout>
                    <Profile />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/profile/bounded"
                element={
                  <ProtectedWithLayout>
                    <BoundedProfile />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/profile/pact-settings"
                element={
                  <ProtectedWithLayout>
                    <PactSettings />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/profile/display-sound"
                element={
                  <ProtectedWithLayout>
                    <DisplaySound />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/profile/privacy"
                element={
                  <ProtectedWithLayout>
                    <PrivacyControl />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/profile/notifications"
                element={
                  <ProtectedWithLayout>
                    <NotificationSettings />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/profile/data"
                element={
                  <ProtectedWithLayout>
                    <DataPortability />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedWithLayout>
                    <Achievements />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/shop"
                element={
                  <ProtectedWithLayout>
                    <Shop />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedWithLayout>
                    <Community />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/legal"
                element={
                  <ProtectedWithLayout>
                    <Legal />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedWithLayout>
                    <Admin />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/admin/cosmetics"
                element={
                  <ProtectedWithLayout>
                    <AdminCosmeticsManager />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/admin/modules"
                element={
                  <ProtectedWithLayout>
                    <AdminModuleManager />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/admin/money"
                element={
                  <ProtectedWithLayout>
                    <AdminMoneyManager />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/admin/mode"
                element={
                  <ProtectedWithLayout>
                    <AdminMode />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/todo"
                element={
                  <ProtectedWithLayout>
                    <TodoList />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedWithLayout>
                    <AdminNotifications />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/inbox"
                element={
                  <ProtectedWithLayout>
                    <Inbox />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/admin/promo-codes"
                element={
                  <ProtectedWithLayout>
                    <AdminPromoManager />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/health"
                element={
                  <ProtectedWithLayout>
                    <Health />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedWithLayout>
                    <Wishlist />
                  </ProtectedWithLayout>
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
