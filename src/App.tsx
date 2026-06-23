import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSocialFeatures } from "@/hooks/useSocialFeatures";
import { routeImports } from "@/lib/prefetchRoutes";

// Lazy-loaded pages
const Auth = lazy(() => import("./pages/Auth"));
const TwoFactor = lazy(() => import("./pages/TwoFactor"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Home = lazy(routeImports.home);
const TheCall = lazy(() => import("./pages/TheCall"));
const Goals = lazy(routeImports.goals);
const NewGoal = lazy(routeImports.newGoal);
const GoalDetail = lazy(routeImports.goalDetail);
const StepDetail = lazy(() => import("./pages/StepDetail"));
const Finance = lazy(routeImports.finance);
const Journal = lazy(routeImports.journal);
const Profile = lazy(routeImports.profile);
const BoundedProfile = lazy(routeImports.boundedProfile);
const PactSettings = lazy(routeImports.pactSettings);
const DisplaySound = lazy(routeImports.displaySound);
const PrivacyControl = lazy(routeImports.privacyControl);
const NotificationSettings = lazy(routeImports.notificationSettings);
const DataPortability = lazy(routeImports.dataPortability);
const LifeAreas = lazy(routeImports.lifeAreas);
const Automations = lazy(routeImports.automations);
const Achievements = lazy(routeImports.achievements);
const Shop = lazy(routeImports.shop);
const Community = lazy(() => import("./pages/Community"));
const Legal = lazy(() => import("./pages/Legal"));
const TodoList = lazy(routeImports.todoList);
const Inbox = lazy(() => import("./pages/Inbox"));
const InboxThread = lazy(() => import("./pages/InboxThread"));
const Health = lazy(routeImports.health);
const Wishlist = lazy(routeImports.wishlist);
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Focus = lazy(routeImports.focus);
const Analytics = lazy(routeImports.analytics);
const Friends = lazy(() => import("./pages/Friends"));
const Calendar = lazy(routeImports.calendar);
const Reviews = lazy(routeImports.reviews);
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

function SocialGate({
  enabled,
  loading,
  children,
}: {
  enabled: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  return enabled ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  const social = useSocialFeatures();
  return (
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
        <Route path="templates/marketplace" element={<SocialGate enabled={social.templatesMarketplace} loading={social.loadingMap.templatesMarketplace}><TemplatesMarketplace /></SocialGate>} />
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
        <Route path="community" element={<SocialGate enabled={social.community} loading={social.loadingMap.community}><Community /></SocialGate>} />
        <Route path="legal" element={<Legal />} />
        <Route path="todo" element={<TodoList />} />
        <Route path="inbox" element={<SocialGate enabled={social.inbox} loading={social.loadingMap.inbox}><Inbox /></SocialGate>} />
        <Route path="inbox/thread/:userId" element={<SocialGate enabled={social.inbox} loading={social.loadingMap.inbox}><InboxThread /></SocialGate>} />
        <Route path="health" element={<Health />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="leaderboard" element={<SocialGate enabled={social.leaderboard} loading={social.loadingMap.leaderboard}><Leaderboard /></SocialGate>} />
        <Route path="hall-of-fame" element={<SocialGate enabled={social.hallOfFame} loading={social.loadingMap.hallOfFame}><HallOfFame /></SocialGate>} />
        <Route path="focus" element={<Focus />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="friends" element={<SocialGate enabled={social.friends} loading={social.loadingMap.friends}><Friends /></SocialGate>} />
        <Route path="guild/:id" element={<SocialGate enabled={social.guilds} loading={social.loadingMap.guilds}><GuildPage /></SocialGate>} />
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
  );
}

const App = () => (
  <AppProviders>
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }>
        <AppRoutes />
      </Suspense>
    </ErrorBoundary>
  </AppProviders>
);

export default App;
