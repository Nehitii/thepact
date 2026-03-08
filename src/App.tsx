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
const Friends = lazy(() => import("./pages/Friends"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminCosmeticsManager = lazy(() => import("./pages/AdminCosmeticsManager"));
const AdminModuleManager = lazy(() => import("./pages/AdminModuleManager"));
const AdminMoneyManager = lazy(() => import("./pages/AdminMoneyManager"));
const AdminMode = lazy(() => import("./pages/AdminMode"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const AdminPromoManager = lazy(() => import("./pages/AdminPromoManager"));
const NotFound = lazy(() => import("./pages/NotFound"));

const SuspensePage = ({ children }: { children: React.ReactNode }) => (
  <Suspense>{children}</Suspense>
);

const App = () => (
  <AppProviders>
    <Routes>
      {/* Public */}
      <Route path="/auth" element={<SuspensePage><Auth /></SuspensePage>} />

      {/* Protected without layout */}
      <Route path="/two-factor" element={<ProtectedRoute><SuspensePage><TwoFactor /></SuspensePage></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><SuspensePage><Onboarding /></SuspensePage></ProtectedRoute>} />

      {/* Protected with layout — AppLayout mounts once, only page content swaps */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<SuspensePage><Home /></SuspensePage>} />
        <Route path="the-call" element={<SuspensePage><TheCall /></SuspensePage>} />
        <Route path="goals" element={<SuspensePage><Goals /></SuspensePage>} />
        <Route path="goals/new" element={<SuspensePage><NewGoal /></SuspensePage>} />
        <Route path="goals/:id" element={<SuspensePage><GoalDetail /></SuspensePage>} />
        <Route path="step/:stepId" element={<SuspensePage><StepDetail /></SuspensePage>} />
        <Route path="finance" element={<SuspensePage><Finance /></SuspensePage>} />
        <Route path="journal" element={<SuspensePage><Journal /></SuspensePage>} />
        <Route path="profile" element={<SuspensePage><Profile /></SuspensePage>} />
        <Route path="profile/bounded" element={<SuspensePage><BoundedProfile /></SuspensePage>} />
        <Route path="profile/pact-settings" element={<SuspensePage><PactSettings /></SuspensePage>} />
        <Route path="profile/display-sound" element={<SuspensePage><DisplaySound /></SuspensePage>} />
        <Route path="profile/privacy" element={<SuspensePage><PrivacyControl /></SuspensePage>} />
        <Route path="profile/notifications" element={<SuspensePage><NotificationSettings /></SuspensePage>} />
        <Route path="profile/data" element={<SuspensePage><DataPortability /></SuspensePage>} />
        <Route path="achievements" element={<SuspensePage><Achievements /></SuspensePage>} />
        <Route path="shop" element={<SuspensePage><Shop /></SuspensePage>} />
        <Route path="community" element={<SuspensePage><Community /></SuspensePage>} />
        <Route path="legal" element={<SuspensePage><Legal /></SuspensePage>} />
        <Route path="todo" element={<SuspensePage><TodoList /></SuspensePage>} />
        <Route path="inbox" element={<SuspensePage><Inbox /></SuspensePage>} />
        <Route path="inbox/thread/:userId" element={<SuspensePage><InboxThread /></SuspensePage>} />
        <Route path="health" element={<SuspensePage><Health /></SuspensePage>} />
        <Route path="wishlist" element={<SuspensePage><Wishlist /></SuspensePage>} />
        <Route path="leaderboard" element={<SuspensePage><Leaderboard /></SuspensePage>} />
        <Route path="focus" element={<SuspensePage><Focus /></SuspensePage>} />
        <Route path="analytics" element={<SuspensePage><Analytics /></SuspensePage>} />
        <Route path="friends" element={<SuspensePage><Friends /></SuspensePage>} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><SuspensePage><Admin /></SuspensePage></AdminRoute>} />
      <Route path="/admin/cosmetics" element={<AdminRoute><SuspensePage><AdminCosmeticsManager /></SuspensePage></AdminRoute>} />
      <Route path="/admin/modules" element={<AdminRoute><SuspensePage><AdminModuleManager /></SuspensePage></AdminRoute>} />
      <Route path="/admin/money" element={<AdminRoute><SuspensePage><AdminMoneyManager /></SuspensePage></AdminRoute>} />
      <Route path="/admin/mode" element={<AdminRoute><SuspensePage><AdminMode /></SuspensePage></AdminRoute>} />
      <Route path="/admin/notifications" element={<AdminRoute><SuspensePage><AdminNotifications /></SuspensePage></AdminRoute>} />
      <Route path="/admin/promo-codes" element={<AdminRoute><SuspensePage><AdminPromoManager /></SuspensePage></AdminRoute>} />

      <Route path="*" element={<SuspensePage><NotFound /></SuspensePage>} />
    </Routes>
  </AppProviders>
);

export default App;
