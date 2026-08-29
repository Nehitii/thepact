import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Bouton, Panneau } from "@/socle/ds/console-ui";
import { toast } from "sonner";
import { oublierLesPreferences, preferencesPosees } from "@/socle/outils/preferencesAffichage";

/* LES REGLAGES QUI VIVENT DANS LE NAVIGATEUR.
 *
 * Ce panneau le dit lui-meme : les remettre a zero n efface AUCUNE
 * donnee. Il n avait donc rien a faire dans la page qui traite de la
 * portabilite du compte — et son compteur, qui est le seul etat qu il
 * porte, n avait pas a vivre a cote de l export.
 *
 * ── LES PRÉFÉRENCES D AFFICHAGE ──
 *   
 *   Dix-sept reglages de lecture vivent dans le navigateur : la
 *   vue du calendrier, le tri du registre, la forme de la
 *   wishlist, le fond de la page de concentration. Aucun ne
 *   merite une colonne en base, mais rien ne les recensait — donc
 *   rien ne pouvait les remettre a zero. Une application coincee
 *   dans un etat bizarre n avait pas d autre porte de sortie que
 *   vider les donnees du site, ce qui deconnecte.
 *   
 *   Ce panneau ne touche a AUCUNE donnee : ni objectif, ni
 *   journal, ni seance en cours, ni brouillon, ni lien colle.
 */
export function PreferencesLocales() {
  /* Compte a l ouverture : le stockage local ne previent pas quand il
     change, et ce nombre ne bouge que lorsqu on appuie ici. */
  const [posees, setPosees] = useState(preferencesPosees);
  return (
    <Panneau
      code="Préférences d’affichage"
      etat={posees === 0
        ? "aucune"
        : `${posees} ${posees > 1 ? "posées" : "posée"}`}
    >
      <div className="space-y-3">
        <p className="ds-t-label text-muted-foreground tracking-wide">
          Vues, tris, mises en page et ambiances, retenus dans ce
          navigateur. Les remettre à zéro n’efface aucune donnée.
        </p>
        <Bouton
          pleine
          disabled={posees === 0}
          onClick={() => {
            const n = oublierLesPreferences();
            setPosees(0);
            toast.success(
              n === 0
                ? "Rien à remettre à zéro"
                : `${n} ${n > 1 ? "préférences remises" : "préférence remise"} à zéro`,
              { description: "Les pages reprendront leur présentation par défaut." },
            );
          }}
        >
          <RotateCcw /> Remettre à zéro
        </Bouton>
      </div>
    </Panneau>
  );
}
