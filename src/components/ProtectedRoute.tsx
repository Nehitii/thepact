import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMfa } from "@/hooks/useMfa";
import { useProfile } from "@/hooks/useProfile";
import { usePact } from "@/hooks/usePact";
import { useSharedPacts } from "@/hooks/useSharedPacts";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const mfa = useMfa();
  const { data: profile, isError: profileError } = useProfile(user?.id);
  const { data: personalPact, isError: pactError } = usePact(user?.id);
  const { memberships, isError: sharedError } = useSharedPacts();

  /* ON ATTEND AUSSI DE SAVOIR SI LE SECOND FACTEUR EST DÛ.

     Seul `loading` — l'authentification — était attendu. L'état MFA,
     lui, était lu tel quel : au premier rendu, avant que la requête
     n'ait répondu, `isRequired` vaut faux faute de donnée. La garde
     ci-dessous laissait donc passer, PUIS redirigeait une fois la
     réponse arrivée. Un aller-retour visible, et une fraction de
     seconde où l'application se monte alors qu'elle ne devrait pas.

     `mfa.isLoading` n'est vrai qu'au tout premier chargement : la
     requête est mise en cache trente secondes sous une clé stable, et
     les rafraîchissements d'arrière-plan ne le rallument pas. Attendre
     ici ne coûte donc pas un voile de chargement à chaque navigation.

     La redirection reste UN CONFORT : la vraie contrainte est portée
     par 88 politiques RLS restrictives qui exigent aal2 — vérifié en
     base, 88 politiques sur 88 tables. La contourner ne donne accès à
     aucune donnée ; elle évite seulement de se retrouver devant une
     application vide sans comprendre pourquoi. */
  if (loading || mfa.isLoading) {
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

  // If critical queries failed, render children anyway instead of bad redirects
  if (profileError || pactError || sharedError) {
    return <>{children}</>;
  }

  // Redirection de confort uniquement : la vraie contrainte est portée par
  // les politiques RLS, qui exigent aal2 sur le JWT. Contourner cette
  // redirection ne donne accès à aucune donnée.
  if (location.pathname !== "/two-factor" && mfa.isRequired) {
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
    !profile.active_pact_id &&
    personalPact &&
    memberships.length > 0
  ) {
    return <Navigate to="/pact-selector" replace />;
  }

  return <>{children}</>;
}

