import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthHistory } from "@/hooks/useHealth";
import { supabase } from "@/integrations/supabase/client";
import { cleDuJour, veilleRelevee, FENETRE_RATTRAPAGE } from "@/lib/health/journee";

/* ═══════════════════════════════════════════════════════════════
   LE RAPPEL

   Il regardait AUJOURD HUI et poussait sa notification apres dix-huit
   heures. Or le releve porte sur la veille depuis la refonte : le
   rappel reclamait donc, en pleine soiree, le compte rendu d une
   journee qui n etait pas finie — precisement le geste qu on avait
   retire. Et il ne disait jamais rien de la veille manquante, qui est
   pourtant la seule dette reelle.

   Il regarde donc LA VEILLE, et il parle LE MATIN : c est le moment ou
   la journee d avant est close et encore fraiche.

   ET IL PARLE LA LANGUE DE L UTILISATEUR. Les trois textes etaient en
   anglais en dur — et ecrits EN BASE, donc figes dans les notifications
   pour toujours. Ils passent maintenant par i18n avant l insertion.
   ═══════════════════════════════════════════════════════════════ */

/** Avant cette heure, on laisse dormir. */
const HEURE_DU_RAPPEL = 9;

export function useHealthReminders() {
  const { t } = useTranslation();
  const { user } = useAuth();

  /* Meme fenetre que la page : la requete tombe sur la meme entree de
     cache, et ce hook ne coute donc aucun aller-retour de plus. */
  const { data: historique = [], isLoading } = useHealthHistory(user?.id, FENETRE_RATTRAPAGE + 1);

  useEffect(() => {
    if (!user?.id || isLoading) return;

    const maintenant = new Date();
    if (maintenant.getHours() < HEURE_DU_RAPPEL) return;

    /* Rien a reclamer si la veille est deja relevee. */
    if (veilleRelevee(historique.map((h) => h.entry_date))) return;

    /* Une fois par jour, pas une par visite. */
    const cle = `health-reminder-${user.id}-${cleDuJour(maintenant)}`;
    if (localStorage.getItem(cle)) return;

    void supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        category: "progress",
        priority: "informational",
        title: t("health.reminder.title", "Le relevé d’hier attend"),
        description: t(
          "health.reminder.body",
          "Hier n’est pas relevé. Une journée close se raconte — deux minutes suffisent.",
        ),
        icon_key: "heart",
        module_key: "health",
        cta_label: t("health.reminder.cta", "Relever maintenant"),
        cta_url: "/health",
      })
      .then(({ error }) => {
        if (!error) localStorage.setItem(cle, "1");
      });
  }, [user?.id, historique, isLoading, t]);
}
