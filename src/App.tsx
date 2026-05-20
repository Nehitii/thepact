import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
const LifeAreas = lazy(() => import("./pages/profile/LifeAreas"));
const Automations = lazy(() => import("./pages/profile/Automations"));
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
const Calendar = lazy(() => import("./pages/Calendar"));
const Reviews = lazy(() => import("./pages/Reviews"));
const ContractSign = lazy(() => import("./pages/ContractSign"));
const GoalsGraph = lazy(() => import("./pages/GoalsGraph"));
const TemplatesMarketplace = lazy(() => import("./pages/TemplatesMarketplace"));
const HallOfFame = lazy(() => import("./pages/HallOfFame"));
const GuildPage = lazy(() => import("./pages/GuildPage"));
const PactSelector = lazy(() => import("./components/pact/PactSelectorModal"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminCosmeticsManager = lazy(() => import("./pages/AdminCosmeticsManager"));
const AdminModuleManager = lazy(() => import("./pages/AdminModuleManager"));
const AdminMoneyManager = lazy(() => import("./pages/AdminMoneyManager"));
const AdminMode = lazy(() => import("./pages/AdminMode"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const AdminPromoManager = lazy(() => import("./pages/AdminPromoManager"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <AppProviders>
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected without layout */}
          <Route path="/two-factor" element={<ProtectedRoute><TwoFactor /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/pact-selector" element={<ProtectedRoute><PactSelector /></ProtectedRoute>} />

          {/* Protected with layout — AppLayout mounts once, only page content swaps */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="the-call" element={<TheCall />} />
            <Route path="goals" element={<Goals />} />
            <Route path="goals/graph" element={<GoalsGraph />} />
            <Route path="templates/marketplace" element={<TemplatesMarketplace />} />
            <Route path="goals/new" element={<NewGoal />} />
            <Route path="goals/:id" element={<GoalDetail />} />
            <Route path="step/:stepId" element={<StepDetail />} />
            <Route path="finance" element={<Finance />} />
            <Route path="journal" element={<Journal />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/bounded" element={<BoundedProfile />} />
            <Route path="profile/pact-settings" element={<PactSettings />} />
            <Route path="profile/display-sound" element={<DisplaySound />} />
            <Route path="profile/privacy" element={<PrivacyControl />} />
            <Route path="profile/notifications" element={<NotificationSettings />} />
            <Route path="profile/data" element={<DataPortability />} />
            <Route path="profile/life-areas" element={<LifeAreas />} />
            <Route path="profile/automations" element={<Automations />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="shop" element={<Shop />} />
            <Route path="community" element={<Community />} />
            <Route path="legal" element={<Legal />} />
            <Route path="todo" element={<TodoList />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="inbox/thread/:userId" element={<InboxThread />} />
            <Route path="health" element={<Health />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="hall-of-fame" element={<HallOfFame />} />
            <Route path="focus" element={<Focus />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="friends" element={<Friends />} />
            <Route path="guild/:id" element={<GuildPage />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="contracts/sign/:contractId" element={<ContractSign />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/cosmetics" element={<AdminRoute><AdminCosmeticsManager /></AdminRoute>} />
          <Route path="/admin/modules" element={<AdminRoute><AdminModuleManager /></AdminRoute>} />
          <Route path="/admin/money" element={<AdminRoute><AdminMoneyManager /></AdminRoute>} />
          <Route path="/admin/mode" element={<AdminRoute><AdminMode /></AdminRoute>} />
          <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
          <Route path="/admin/promo-codes" element={<AdminRoute><AdminPromoManager /></AdminRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  </AppProviders>
);

export default App;
