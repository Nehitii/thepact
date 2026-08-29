import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { AppSidebar } from "@/app/AppSidebar";
import { CommandPalette } from "@/app/CommandPalette";
import { MobileBottomNav } from "@/app/MobileBottomNav";
import { useServerAdminCheck } from "@/domaines/administration";
import { PorteAdmin } from "@/domaines/administration";

/**
 * L'ENTRÉE DE L'ADMINISTRATION.
 *
 * ═══════════════════════════════════════════════════════════════
 * ELLE MONTAIT UNE MISE EN PAGE À ELLE, ET C'ÉTAIT UN VESTIGE.
 *
 * L'administration vit hors d'AppLayout — c'est un choix défendable,
 * ce n'est pas le même contexte. Mais elle reconstruisait sa coque
 * avec « SidebarProvider », « SidebarInset » et « SidebarTrigger »,
 * les primitives shadcn de l'ANCIENNE barre latérale. La barre
 * refondue n'en a plus besoin : elle porte sa propre largeur, son
 * propre repli, et son déclencheur mobile. Résultat, deux systèmes de
 * mise en page superposés, et une barre d'en-tête « THE PACT » qui ne
 * ressemblait à rien d'autre dans l'application.
 *
 * Ici, la structure est celle d'AppLayout, à l'identique : la barre,
 * puis le contenu. La barre du bas revient aussi — sans elle, on
 * arrivait sur un téléphone dans l'administration sans aucun moyen
 * d'en sortir autrement que par le bouton précédent.
 *
 * ═══ TROIS PORTES, DANS CET ORDRE ═══
 *
 *   1. ProtectedRoute      — être connecté
 *   2. useServerAdminCheck — porter le rôle, vérifié par le serveur
 *   3. PorteAdmin          — l'avoir prouvé sur CETTE session (aal2)
 *
 * Aucune des trois ne protège les données : ce sont les politiques de
 * la base qui le font. Celles-ci évitent d'ouvrir un écran qui ne
 * répondrait de toute façon rien.
 * ═══════════════════════════════════════════════════════════════
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useServerAdminCheck();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full relative">
        <CommandPalette />
        <AppSidebar />

        <div className="flex-1 min-w-0 overflow-x-hidden overflow-hidden isolate flex flex-col">
          <main className="flex-1 min-w-0 overflow-x-clip overflow-y-auto relative z-0 mobile-nav-spacer">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : data?.isAdmin ? (
              /* LE RÔLE OUVRE LA ROUTE, LE SECOND FACTEUR OUVRE LA PORTE.
                 Le contrôle serveur dit que ce compte EST administrateur ;
                 il ne dit pas que c'est bien lui qui tient le clavier. Un
                 jeton volé porte le rôle. Voir PorteAdmin. */
              <PorteAdmin>{children}</PorteAdmin>
            ) : (
              <Navigate to="/" replace />
            )}
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </ProtectedRoute>
  );
}
