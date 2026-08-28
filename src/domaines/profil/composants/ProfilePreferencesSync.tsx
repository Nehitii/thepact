import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useProfileSettings } from "@/domaines/profil/hooks/useProfileSettings";

export function ProfilePreferencesSync() {
  const { profile } = useProfileSettings();
  const { setTheme, theme } = useTheme();

  /* CET EFFET NE DOIT REAGIR QU AU PROFIL, PAS AU THEME.
     `theme` etait dans les dependances : toute bascule le relancait,
     y compris celle que l utilisateur venait de demander. Il relisait
     alors une preference encore ancienne et remettait le theme
     precedent — l aller-retour visible a l ecran.

     Depuis, la mutation ecrit dans le cache avant le reseau ; mais
     l effet n a de toute facon aucune raison de se declencher sur un
     changement de theme, seulement sur un changement de PREFERENCE. */
  useEffect(() => {
    const voulu = profile?.theme_preference;
    if (!voulu) return;
    setTheme(voulu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme_preference]);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = !!profile?.reduce_motion;
    root.setAttribute("data-reduce-motion", reduce ? "true" : "false");
  }, [profile?.reduce_motion]);

  return null;
}
