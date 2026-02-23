import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { useServerAdminCheck } from "@/hooks/useServerAdminCheck";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useServerAdminCheck();

  return (
    <ProtectedRoute>
      <AppLayout>
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data?.isAdmin ? (
          children
        ) : (
          <Navigate to="/" replace />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
