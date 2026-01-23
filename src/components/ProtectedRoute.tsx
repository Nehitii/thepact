import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTwoFactor } from "@/hooks/useTwoFactor";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const twoFactor = useTwoFactor();

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
  // Allow the /two-factor route itself to render to avoid redirect loops.
  if (location.pathname !== "/two-factor" && twoFactor.isRequired) {
    return (
      <Navigate
        to="/two-factor"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    );
  }

  return <>{children}</>;
}

