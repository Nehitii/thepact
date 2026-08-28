import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   QUELS FOURNISSEURS SONT RÉELLEMENT BRANCHÉS ?

   L'écran de connexion affichait trois tuiles — Discord, GitHub,
   Google — écrites en dur. Aucune des trois n'est configurée côté
   serveur : `/auth/v1/settings` répond `external: { discord: false,
   github: false, google: false }`, et les journaux d'authentification
   montrent des `/authorize` qui repartent en « provider is not
   enabled ». Quelqu'un a cliqué, et n'est arrivé nulle part.

   ON NE VA PAS TENIR CETTE LISTE À LA MAIN. Une constante dans le code,
   qu'il faudrait penser à changer le jour où l'on configure un
   fournisseur, finirait par mentir — dans un sens ou dans l'autre.

   GoTrue publie l'état sur `/auth/v1/settings`, qui ne demande que la
   clé publiable, déjà dans le paquet. On le lit au montage : une tuile
   n'apparaît que si le serveur dit que le fournisseur répond. Le jour
   où l'un est activé dans le tableau de bord Supabase, il apparaît tout
   seul — sans toucher au code, sans reconstruire, sans redéployer.

   ═══ CE QU'ON FAIT QUAND LA RÉPONSE N'ARRIVE PAS ═══

   Deux échecs possibles, et ils ne se valent pas :

     — TOUT MASQUER : quelqu'un qui s'est inscrit par Google n'a pas de
       mot de passe. Lui retirer sa tuile parce qu'une requête a échoué,
       c'est l'enfermer dehors de son propre compte.
     — TOUT MONTRER : au pire une tuile ne mène nulle part, et l'écran
       le dit en clair. C'est le comportement d'avant, celui dont on
       sait qu'il est supportable.

   On garde le second. Un repli doit ramener à l'état connu, pas
   inventer un état plus strict que ce qu'on a mesuré.

   ═══ POURQUOI RIEN AVANT LA RÉPONSE ═══

   L'état initial est la liste vide, pas la liste complète. Montrer les
   trois puis en retirer trois, c'est un clignotement à chaque
   chargement de l'écran le plus vu de l'application. Les faire
   apparaître quand la réponse arrive ne coûte qu'à ceux qui ont
   réellement un fournisseur.
   ═══════════════════════════════════════════════════════════════ */

export type Fournisseur = "discord" | "github" | "google";

const TOUS: Fournisseur[] = ["discord", "github", "google"];

export function useFournisseursActifs(): Fournisseur[] {
  const [actifs, setActifs] = useState<Fournisseur[]>([]);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const cle = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !cle) {
      setActifs(TOUS);
      return;
    }

    const abandon = new AbortController();
    fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: cle },
      signal: abandon.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((reponse: { external?: Record<string, boolean> }) => {
        const externes = reponse?.external ?? {};
        setActifs(TOUS.filter((f) => externes[f] === true));
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        setActifs(TOUS);
      });

    return () => abandon.abort();
  }, []);

  return actifs;
}
