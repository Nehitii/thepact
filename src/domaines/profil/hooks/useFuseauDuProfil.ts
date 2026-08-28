import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Le fuseau du profil suit le navigateur.
 *
 * ═══════════════════════════════════════════════════════════════
 * LA COLONNE EXISTAIT, ET VALAIT « UTC » POUR TOUT LE MONDE.
 *
 * Personne ne l'avait jamais renseignée — il n'y avait aucun écran pour
 * le faire, et aucun code pour la déduire. Deux fonctions serveur la
 * lisaient quand même :
 *
 *   « push-send » y calcule les HEURES CALMES. Avec « UTC » pour un
 *   utilisateur parisien, une plage 22 h–8 h s'applique en réalité de
 *   minuit à 10 h : une notification à 23 h locale y passe pour 21 h et
 *   sort quand même. C'est le défaut qui se voyait le moins et qui
 *   dérangeait le plus.
 *
 *   la fonction de M.I.A la lisait dans son select sans jamais s'en servir. Elle
 *   lui sert maintenant de second recours, derrière le fuseau que le
 *   navigateur envoie avec chaque question.
 *
 * ON N'ÉCRIT QUE SI C'EST DIFFÉRENT. Une écriture à chaque ouverture de
 * l'application coûterait une requête par page pour ne rien changer —
 * et « updated_at » remonterait sans qu'aucune donnée n'ait bougé.
 *
 * ET ON N'ÉCRIT QU'UNE FOIS PAR SESSION. Un échec ne se rejoue pas en
 * boucle : le fuseau n'est pas assez important pour insister.
 * ═══════════════════════════════════════════════════════════════
 */
export function useFuseauDuProfil(userId: string | undefined) {
  const dejaTente = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || dejaTente.current === userId) return;
    dejaTente.current = userId;

    let vivant = true;
    void (async () => {
      let fuseau: string;
      try {
        fuseau = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return; /* navigateur sans Intl complet : on laisse la colonne */
      }
      if (!fuseau) return;

      const { data } = await supabase
        .from("profiles")
        .select("timezone")
        .eq("id", userId)
        .maybeSingle();
      if (!vivant || data?.timezone === fuseau) return;

      await supabase.from("profiles").update({ timezone: fuseau }).eq("id", userId);
    })();

    return () => { vivant = false; };
  }, [userId]);
}
