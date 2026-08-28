import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { trackLogin, initializeAchievementTracking } from "@/lib/achievements";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  /* `AuthProvider` est monté SOUS `QueryClientProvider` (AppProviders,
     l. 42 et 47) : le client est donc atteignable ici. */
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Sync user with Sentry for error context
        if (session?.user) {
          /* L'IDENTIFIANT SEUL, PAS L'ADRESSE. La page /legal annonce
             que Sentry ne reçoit qu'« un identifiant technique de
             session » — et depuis le 28/08 c'est la page que l'écran de
             consentement Google présente comme nos règles de
             confidentialité. L'adresse partait quand même. On aligne le
             code sur la promesse, pas l'inverse : l'identifiant suffit
             à relier une erreur à un compte, et il ne dit rien à qui
             n'a pas déjà accès à la base. */
          Sentry.setUser({ id: session.user.id });
        } else {
          Sentry.setUser(null);
        }

        // Handle sign in - track login for achievements
        if (event === "SIGNED_IN" && session?.user) {
          setTimeout(() => {
            initializeAchievementTracking(session.user.id);
            trackLogin(session.user.id);
          }, 0);
        }

        /* ═══ LA DÉCONNEXION VIDE LE CACHE ═══

           Elle ne faisait que naviguer vers /auth. Tout ce que React
           Query avait mis de côté pour la session précédente restait
           en mémoire — et la connexion suivante le retrouvait.

           CE QUE ÇA A COÛTÉ : le second facteur cessait d'être
           demandé. `useMfa` est cachée sous ["mfa", user.id] ; après
           une déconnexion suivie d'une reconnexion du MÊME compte, la
           clé est identique, et React Query sert INSTANTANÉMENT
           l'entrée de la session d'avant — celle où currentLevel valait
           déjà « aal2 ». `isRequired` retombait à faux, la porte
           s'ouvrait sans code. Constaté à l'usage, facteur `verified`
           bien présent en base.

           CE N'EST PAS QU'UNE AFFAIRE DE 2FA. Un cache qui survit à
           une déconnexion, c'est la personne suivante qui voit un
           instant les données de la précédente. Sur un poste partagé,
           ça se voit. On efface tout, sans exception : ce qui
           appartenait à une session finie n'a rien à faire dans la
           suivante. */
        if (event === "SIGNED_OUT") {
          queryClient.clear();
          setTimeout(() => {
            navigate("/auth", { replace: true });
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Sync existing session with Sentry
      if (session?.user) {
        Sentry.setUser({ id: session.user.id, email: session.user.email ?? undefined });
      } else {
        Sentry.setUser(null);
      }
      
      // Track login for existing session
      if (session?.user) {
        setTimeout(() => {
          initializeAchievementTracking(session.user.id);
          trackLogin(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, queryClient]);

  const signOut = async () => {
    await supabase.auth.signOut();
    Sentry.setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
