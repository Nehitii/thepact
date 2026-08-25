import { useEffect, useState } from "react";
import { chargerProfilsPublics } from "@/lib/profilsPublics";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/**
 * La presence des allies. Rend :
 *   - lastSeenMap : identifiant -> horodatage ISO, ou null
 *   - onlineCount : combien ont ete vus dans ONLINE_WINDOW_MS
 *
 * La source est `profils_publics`, qui n expose `last_seen_at` que si
 * son porteur accepte de montrer son activite. Un sondage d une minute,
 * pas d abonnement au direct : les politiques de `profiles` ne
 * laisseraient de toute facon passer aucun evenement d autrui.
 */
export function useFriendsPresence(friendIds: string[]) {
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string | null>>({});

  // Stable key to avoid effect thrash on identical arrays
  const idsKey = friendIds.slice().sort().join(",");

  useEffect(() => {
    if (!friendIds.length) {
      setLastSeenMap({});
      return;
    }

    let cancelled = false;

    /* DEUX DEFAUTS D UN COUP.
       Cette lecture interrogeait `profiles` pour autrui, ce que la
       politique `auth.uid() = id` interdit : la pastille de presence ne
       s allumait jamais pour personne. Et « Afficher le statut
       d activite » ne s interposait nulle part — couper le reglage
       n empechait pas de diffuser sa presence.

       La projection publique rend `last_seen_at`, et ne le rend que si
       son porteur l accepte. */
    const fetchAll = async () => {
      const profils = await chargerProfilsPublics(friendIds).catch(() => new Map());
      if (cancelled) return;
      const map: Record<string, string | null> = {};
      profils.forEach((p, id) => { map[id] = p.last_seen_at; });
      setLastSeenMap(map);
    };

    fetchAll();

    /* L ABONNEMENT AU DIRECT NE POUVAIT RIEN RECEVOIR.
       Realtime applique les memes politiques que la lecture : avec
       `auth.uid() = id` sur `profiles`, un abonnement aux lignes des
       amis ne remonte jamais rien. Il tenait un canal ouvert pour
       zero evenement — et, s il en avait recu, il aurait contourne le
       reglage « Afficher le statut d activite », que seule la
       projection publique applique.

       Le sondage d une minute, qui existait deja en filet, est
       desormais le seul chemin. La presence a une fenetre de cinq
       minutes : une minute de retard n y change rien. */
    const interval = window.setInterval(fetchAll, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Tick every 30s to recompute onlineCount as time passes
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const now = Date.now();
  const onlineCount = Object.values(lastSeenMap).filter((ts) => {
    if (!ts) return false;
    return now - new Date(ts).getTime() < ONLINE_WINDOW_MS;
  }).length;

  return { lastSeenMap, onlineCount };
}