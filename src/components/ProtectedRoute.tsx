import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { useProfile } from "@/hooks/useProfile";
import { usePact } from "@/hooks/usePact";
import { useSharedPacts } from "@/hooks/useSharedPacts";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const twoFactor = useTwoFactor();
  const { data: profile, isError: profileError } = useProfile(user?.id);
  const { data: personalPact, isError: pactError } = usePact(user?.id);
  const { memberships, isError: sharedError } = useSharedPacts();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Gate the entire app when 2FA is enabled and required.
  if (location.pathname !== "/two-factor" && twoFactor.isRequired) {
    return (
      <Navigate
        to="/two-factor"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    );
  }

  // Pact selector: if user has personal pact + shared pact memberships and no active choice
  const exemptPaths = ["/two-factor", "/pact-selector", "/onboarding", "/auth"];
  if (
    !exemptPaths.includes(location.pathname) &&
    profile &&
    !(profile as any).active_pact_id &&
    personalPact &&
    memberships.length > 0
  ) {
    return <Navigate to="/pact-selector" replace />;
  }

  return <>{children}</>;
}

