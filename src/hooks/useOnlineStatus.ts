import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVisibleInterval } from "./useVisibleInterval";

/**
 * La présence : « vu il y a … ».
 *
 * ═══════════════════════════════════════════════════════════════
 * C'ÉTAIT L'ÉCRITURE LA PLUS FRÉQUENTE DE TOUTE LA BASE.
 *
 * Relevé dans pg_stat_statements : 16 204 appels et 99,7 secondes
 * cumulées pour « UPDATE profiles SET last_seen_at » — devant toutes les
 * autres écritures réunies, la deuxième n'en comptant que cinquante. Une
 * par minute, indéfiniment, ET ONGLET CACHÉ : mille quatre cent quarante
 * par jour et par personne, dont la plupart pour dire « je suis là » à
 * personne.
 *
 * DEUX CORRECTIONS, ET AUCUNE NE CHANGE CE QU'ON VOIT.
 *
 * L'ONGLET CACHÉ NE POINTE PLUS. Le projet avait déjà
 * « useVisibleInterval » — le calendrier s'en sert pour son horloge, avec
 * ce commentaire : « une minute suffit, l'horloge s'arrête quand l'onglet
 * est caché ». La présence ne s'en servait pas. Au retour, un ping part
 * tout de suite : ce qui compte est d'être vu présent QUAND on revient,
 * pas d'avoir signalé son absence pendant qu'on était parti.
 *
 * ET LA CADENCE PASSE À DEUX MINUTES. « Vu il y a moins de deux minutes »
 * et « vu il y a moins d'une minute » disent la même chose à qui lit une
 * pastille verte ; l'un coûte le double de l'autre.
 * ═══════════════════════════════════════════════════════════════
 */
export function useOnlineStatus(intervalMs = 120_000) {
  const { user } = useAuth();
  const dernier = useRef(0);

  const pointer = useCallback(() => {
    if (!user?.id) return;
    /* Un garde de temps en plus de l'intervalle : le retour d'onglet
       déclenche un ping immédiat, et deux allers-retours en dix secondes
       en feraient deux de trop. */
    const maintenant = Date.now();
    if (maintenant - dernier.current < 30_000) return;
    dernier.current = maintenant;
    /* LE « .then » N EST PAS DU BRUIT : IL DECLENCHE.
       Un constructeur de requete supabase-js est PARESSEUX — il ne part
       qu au moment ou on l attend. Le remplacer par un « void » le rend
       muet : verifie, last_seen_at ne bougeait plus du tout. */
    void supabase
      .from("profiles")
      .update({ last_seen_at: new Date(maintenant).toISOString() } as never)
      .eq("id", user.id)
      .then(() => {});
  }, [user?.id]);

  /* Le premier ping ne passe pas par l'intervalle : on veut être vu
     présent dès l'ouverture, pas deux minutes plus tard. */
  useEffect(() => {
    if (user?.id) pointer();
  }, [user?.id, pointer]);

  useVisibleInterval(pointer, intervalMs);
}
