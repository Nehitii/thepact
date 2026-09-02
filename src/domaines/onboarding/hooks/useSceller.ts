import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import { messageDErreur } from "@/socle/outils/erreurs";
import { trackPactCreated } from "@/domaines/succes";
import { objectifDuGabarit, objectifSurMesure } from "@/domaines/onboarding/logique/premierObjectif";
import { GABARITS, versObjectif } from "@/domaines/onboarding/logique/gabarits";
import { VERSION_ALPHABET } from "@/domaines/onboarding/logique/sigil";
import { pretASceller, type EtatDuRite } from "@/domaines/onboarding/logique/rite";

/**
 * SCELLER LE PACTE.
 *
 * Les cinq ecritures de l ancienne page, reprises telles quelles :
 * elles etaient justes, et un rite qui se reecrit n a aucune raison de
 * reecrire aussi ce qui marchait. Ce qui change, c est qu elles
 * vivent dans un crochet et non au milieu du rendu.
 *
 * L ORDRE COMPTE. Le pacte d abord — les valeurs et l objectif s y
 * accrochent, et son identifiant n existe qu apres. Le nom du porteur
 * avant, parce qu il ne depend de rien.
 *
 * « trackPactCreated » RESTE EN VOID. Le succes « Le pacte scelle » se
 * gagne ici et nulle part ailleurs, mais sceller son pacte compte plus
 * que le succes qui le celebre : si le comptage echoue, le rite
 * continue.
 *
 * LE SIGIL N EST PAS ECRIT, SA VERSION L EST. Le sceau se recalcule
 * partout a partir du nom et des valeurs ; ce qu on retient, c est
 * sous quel alphabet il a ete jure — sans quoi un trait ajoute un jour
 * redessinerait tous les sceaux en silence.
 */
export function useSceller() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [enCours, setEnCours] = useState(false);

  /* L exemple montre sur la carte devient le nom de l objectif, et il
     vient de la traduction : le gabarit ne porte que sa structure. */
  const gabaritChoisi = useCallback(
    (id: string) => {
      const g = GABARITS.find((x) => x.id === id) ?? GABARITS[0];
      return versObjectif(g, t(`onboarding.gabarits.${g.id}.exemple`));
    },
    [t],
  );

  const sceller = useCallback(
    async (etat: EtatDuRite): Promise<boolean> => {
      /* On ne presente pas a la base ce qu elle refuserait : « name »
         et « mantra » sont NOT NULL, et un ecran saute par un bouton
         mal garde finirait en erreur au dernier moment du rite. */
      if (!user || !pretASceller(etat)) return false;
      setEnCours(true);
      try {
        if (etat.nomDuPorteur.trim()) {
          await supabase
            .from("profiles")
            .update({ display_name: etat.nomDuPorteur.trim() })
            .eq("id", user.id);
        }

        const { data: pacte, error: refus } = await supabase
          .from("pacts")
          .insert({
            user_id: user.id,
            name: etat.nomDuPacte.trim(),
            mantra: etat.mantra.trim(),
            symbol: etat.symbole,
            color: etat.couleur,
            sigil_version: VERSION_ALPHABET,
          })
          .select()
          .single();
        if (refus) throw refus;

        void trackPactCreated(user.id);

        if (etat.valeurs.length > 0) {
          await supabase.from("user_values").insert(
            etat.valeurs.map((label, i) => ({ user_id: user.id, label, rank: i })),
          );
        }

        /* Le second passage n en demande pas : le porteur a deja des
           objectifs, et M.I.A. ne se represente pas pour en reclamer un. */
        if (etat.objectif) {
          await supabase.from("goals").insert(
            "gabarit" in etat.objectif
              ? objectifDuGabarit(gabaritChoisi(etat.objectif.gabarit), pacte.id)
              : objectifSurMesure(etat.objectif.surMesure, pacte.id),
          );
        }
        return true;
      } catch (erreur: unknown) {
        toast.error(t("common.error"), { description: messageDErreur(erreur) });
        setEnCours(false);
        return false;
      }
    },
    [user, t, gabaritChoisi],
  );

  return { sceller, enCours };
}
