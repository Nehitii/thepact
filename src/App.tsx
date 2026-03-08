import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/AdminRoute";

// Lazy-loaded pages
const Auth = lazy(() => import("./pages/Auth"));
const TwoFactor = lazy(() => import("./pages/TwoFactor"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Home = lazy(() => import("./pages/Home"));
const TheCall = lazy(() => import("./pages/TheCall"));
const Goals = lazy(() => import("./pages/Goals"));
const NewGoal = lazy(() => import("./pages/NewGoal"));
const GoalDetail = lazy(() => import("./pages/GoalDetail"));
const StepDetail = lazy(() => import("./pages/StepDetail"));
const Finance = lazy(() => import("./pages/Finance"));
const Journal = lazy(() => import("./pages/Journal"));
const Profile = lazy(() => import("./pages/Profile"));
const BoundedProfile = lazy(() => import("./pages/profile/BoundedProfile"));
const PactSettings = lazy(() => import("./pages/profile/PactSettings"));
const DisplaySound = lazy(() => import("./pages/profile/DisplaySound"));
const PrivacyControl = lazy(() => import("./pages/profile/PrivacyControl"));
const NotificationSettings = lazy(() => import("./pages/profile/NotificationSettings"));
const DataPortability = lazy(() => import("./pages/profile/DataPortability"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Shop = lazy(() => import("./pages/Shop"));
const Community = lazy(() => import("./pages/Community"));
const Legal = lazy(() => import("./pages/Legal"));
const TodoList = lazy(() => import("./pages/TodoList"));
const Inbox = lazy(() => import("./pages/Inbox"));
const InboxThread = lazy(() => import("./pages/InboxThread"));
const Health = lazy(() => import("./pages/Health"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Focus = lazy(() => import("./pages/Focus"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminCosmeticsManager = lazy(() => import("./pages/AdminCosmeticsManager"));
const AdminModuleManager = lazy(() => import("./pages/AdminModuleManager"));
const AdminMoneyManager = lazy(() => import("./pages/AdminMoneyManager"));
const AdminMode = lazy(() => import("./pages/AdminMode"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const AdminPromoManager = lazy(() => import("./pages/AdminPromoManager"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Route configuration
type RouteConfig =
  | { path: string; type: "public"; Component: React.LazyExoticComponent<React.ComponentType> }
  | { path: string; type: "protected"; Component: React.LazyExoticComponent<React.ComponentType> }
  | { path: string; type: "protectedNoLayout"; Component: React.LazyExoticComponent<React.ComponentType> }
  | { path: string; type: "admin"; Component: React.LazyExoticComponent<React.ComponentType> };

const routes: RouteConfig[] = [
  // Public
  { path: "/auth", type: "public", Component: Auth },

  // Protected without layout (special pages)
  { path: "/two-factor", type: "protectedNoLayout", Component: TwoFactor },
  { path: "/onboarding", type: "protectedNoLayout", Component: Onboarding },

  // Protected with layout
  { path: "/", type: "protected", Component: Home },
  { path: "/the-call", type: "protected", Component: TheCall },
  { path: "/goals", type: "protected", Component: Goals },
  { path: "/goals/new", type: "protected", Component: NewGoal },
  { path: "/goals/:id", type: "protected", Component: GoalDetail },
  { path: "/step/:stepId", type: "protected", Component: StepDetail },
  { path: "/finance", type: "protected", Component: Finance },
  { path: "/journal", type: "protected", Component: Journal },
  { path: "/profile", type: "protected", Component: Profile },
  { path: "/profile/bounded", type: "protected", Component: BoundedProfile },
  { path: "/profile/pact-settings", type: "protected", Component: PactSettings },
  { path: "/profile/display-sound", type: "protected", Component: DisplaySound },
  { path: "/profile/privacy", type: "protected", Component: PrivacyControl },
  { path: "/profile/notifications", type: "protected", Component: NotificationSettings },
  { path: "/profile/data", type: "protected", Component: DataPortability },
  { path: "/achievements", type: "protected", Component: Achievements },
  { path: "/shop", type: "protected", Component: Shop },
  { path: "/community", type: "protected", Component: Community },
  { path: "/legal", type: "protected", Component: Legal },
  { path: "/todo", type: "protected", Component: TodoList },
  { path: "/inbox", type: "protected", Component: Inbox },
  { path: "/inbox/thread/:userId", type: "protected", Component: InboxThread },
  { path: "/health", type: "protected", Component: Health },
  { path: "/wishlist", type: "protected", Component: Wishlist },

  // Admin
  { path: "/admin", type: "admin", Component: Admin },
  { path: "/admin/cosmetics", type: "admin", Component: AdminCosmeticsManager },
  { path: "/admin/modules", type: "admin", Component: AdminModuleManager },
  { path: "/admin/money", type: "admin", Component: AdminMoneyManager },
  { path: "/admin/mode", type: "admin", Component: AdminMode },
  { path: "/admin/notifications", type: "admin", Component: AdminNotifications },
  { path: "/admin/promo-codes", type: "admin", Component: AdminPromoManager },
];

function renderRoute({ path, type, Component }: RouteConfig) {
  switch (type) {
    case "public":
      return <Route key={path} path={path} element={<Suspense><Component /></Suspense>} />;
    case "protectedNoLayout":
      return (
        <Route key={path} path={path} element={
          <ProtectedRoute><Suspense><Component /></Suspense></ProtectedRoute>
        } />
      );
    case "protected":
      return (
        <Route key={path} path={path} element={
          <ProtectedRoute><AppLayout><Suspense><Component /></Suspense></AppLayout></ProtectedRoute>
        } />
      );
    case "admin":
      return (
        <Route key={path} path={path} element={
          <AdminRoute><Suspense><Component /></Suspense></AdminRoute>
        } />
      );
  }
}

const App = () => (
  <AppProviders>
    <Routes>
      {routes.map(renderRoute)}
      <Route path="*" element={<Suspense><NotFound /></Suspense>} />
    </Routes>
  </AppProviders>
);

export default App;
